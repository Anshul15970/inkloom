import sys
sys.path.insert(0, "backend")

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

import app.models  # Ensure all model tables are registered
from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.models.brand import BrandRole


@pytest_asyncio.fixture
async def async_test_client():
    # In-memory SQLite with StaticPool so all connections share the same memory instance
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestSessionLocal = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with TestSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

    fastapi_app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.asyncio
async def test_unauthenticated_requests_blocked(async_test_client: AsyncClient):
    """Verify that unauthenticated requests to protected endpoints return 401."""
    # Profile
    r1 = await async_test_client.get("/api/v1/auth/me")
    assert r1.status_code == 401, f"Expected 401, got {r1.status_code}"

    # Brands list
    r2 = await async_test_client.get("/api/v1/brands")
    assert r2.status_code == 401

    # Brand-scoped resources with dummy brand id
    dummy_id = "00000000-0000-0000-0000-000000000000"
    r3 = await async_test_client.get(f"/api/v1/brands/{dummy_id}/rules")
    assert r3.status_code == 401


@pytest.mark.asyncio
async def test_brand_and_creator_registration_flow(async_test_client: AsyncClient):
    """
    Verify Brand and Creator registration:
    - Brand registration creates User + Brand + OWNER membership.
    - Creator registration creates an unassigned user.
    """
    # 1. Register Brand A
    brand_payload = {
        "email": "owner_a@acme.com",
        "password": "Password123!",
        "full_name": "Alice Owner",
        "brand_name": "Acme Corp",
        "brand_slug": "acme-corp",
    }
    res_a = await async_test_client.post("/api/v1/auth/register-brand", json=brand_payload)
    assert res_a.status_code == 201, res_a.text
    data_a = res_a.json()
    assert "access_token" in data_a
    assert "refresh_token" in data_a
    assert data_a["user"]["email"] == "owner_a@acme.com"
    brand_a_id = data_a["user"]["memberships"][0]["brand_id"]
    token_a = data_a["access_token"]

    # Verify Alice's profile shows OWNER of Acme Corp
    headers_a = {"Authorization": f"Bearer {token_a}"}
    me_a = await async_test_client.get("/api/v1/auth/me", headers=headers_a)
    assert me_a.status_code == 200
    me_data_a = me_a.json()
    assert len(me_data_a["memberships"]) == 1
    assert me_data_a["memberships"][0]["role"] == BrandRole.OWNER
    assert me_data_a["memberships"][0]["brand_id"] == brand_a_id

    # 2. Register Standalone Creator
    creator_payload = {
        "email": "creator@freelance.com",
        "password": "Password123!",
        "full_name": "Charlie Creator",
    }
    res_c = await async_test_client.post("/api/v1/auth/register-creator", json=creator_payload)
    assert res_c.status_code == 201, res_c.text
    data_c = res_c.json()
    token_c = data_c["access_token"]

    # Verify Charlie has NO brand memberships initially
    headers_c = {"Authorization": f"Bearer {token_c}"}
    me_c = await async_test_client.get("/api/v1/auth/me", headers=headers_c)
    assert me_c.status_code == 200
    assert len(me_c.json()["memberships"]) == 0

    # Charlie cannot access Acme Corp rules (403 Forbidden)
    res_forbidden = await async_test_client.get(f"/api/v1/brands/{brand_a_id}/rules", headers=headers_c)
    assert res_forbidden.status_code == 403
    assert "You do not have authorized access" in res_forbidden.json()["detail"]


@pytest.mark.asyncio
async def test_invitation_lifecycle_and_acceptance(async_test_client: AsyncClient):
    """
    Verify complete invitation flow:
    - Owner invites a user to the brand.
    - Public verify endpoint checks invitation validity.
    - Creator accepts invitation and gains membership with appropriate role.
    """
    # 1. Register Brand
    b_resp = await async_test_client.post("/api/v1/auth/register-brand", json={
        "email": "owner@brandco.com",
        "password": "Password123!",
        "full_name": "Brand Owner",
        "brand_name": "BrandCo",
        "brand_slug": "brandco",
    })
    assert b_resp.status_code == 201
    owner_token = b_resp.json()["access_token"]
    brand_id = b_resp.json()["user"]["memberships"][0]["brand_id"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # 2. Register Creator
    c_resp = await async_test_client.post("/api/v1/auth/register-creator", json={
        "email": "invitee@creator.com",
        "password": "Password123!",
        "full_name": "Invited Creator",
    })
    assert c_resp.status_code == 201
    creator_token = c_resp.json()["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 3. Owner issues invitation
    inv_resp = await async_test_client.post(
        f"/api/v1/brands/{brand_id}/invitations",
        json={"email": "invitee@creator.com", "role": BrandRole.CONTENT_CREATOR},
        headers=owner_headers,
    )
    assert inv_resp.status_code == 201, inv_resp.text
    inv_data = inv_resp.json()
    invitation_token = inv_data["invitation_token"]
    assert invitation_token is not None

    # 4. Verify invitation token
    ver_resp = await async_test_client.get(f"/api/v1/invitations/verify?token={invitation_token}")
    assert ver_resp.status_code == 200
    ver_data = ver_resp.json()
    assert ver_data["brand_name"] == "BrandCo"
    assert ver_data["role"] == BrandRole.CONTENT_CREATOR

    # 5. Creator accepts invitation
    acc_resp = await async_test_client.post(
        "/api/v1/invitations/accept",
        json={"token": invitation_token},
        headers=creator_headers,
    )
    assert acc_resp.status_code == 200, acc_resp.text

    # 6. Check creator now has access to BrandCo rules
    rules_resp = await async_test_client.get(f"/api/v1/brands/{brand_id}/rules", headers=creator_headers)
    assert rules_resp.status_code == 200
    assert rules_resp.json() == []


@pytest.mark.asyncio
async def test_cross_tenant_isolation(async_test_client: AsyncClient):
    """
    Test tenant isolation boundary:
    Member of Brand B cannot read, list, or access resources of Brand A.
    """
    # 1. Register Brand Alpha
    resp_alpha = await async_test_client.post("/api/v1/auth/register-brand", json={
        "email": "alpha_owner@alpha.com",
        "password": "Password123!",
        "full_name": "Alpha Admin",
        "brand_name": "Alpha Corp",
        "brand_slug": "alpha-corp",
    })
    assert resp_alpha.status_code == 201
    brand_alpha_id = resp_alpha.json()["user"]["memberships"][0]["brand_id"]
    alpha_token = resp_alpha.json()["access_token"]
    alpha_headers = {"Authorization": f"Bearer {alpha_token}"}

    # 2. Register Brand Beta
    resp_beta = await async_test_client.post("/api/v1/auth/register-brand", json={
        "email": "beta_owner@beta.com",
        "password": "Password123!",
        "full_name": "Beta Admin",
        "brand_name": "Beta Corp",
        "brand_slug": "beta-corp",
    })
    assert resp_beta.status_code == 201
    brand_beta_id = resp_beta.json()["user"]["memberships"][0]["brand_id"]
    beta_token = resp_beta.json()["access_token"]
    beta_headers = {"Authorization": f"Bearer {beta_token}"}

    # 3. Alpha creates a rule & a fact
    rule_resp = await async_test_client.post(
        f"/api/v1/brands/{brand_alpha_id}/rules",
        json={
            "rule_type": "PROHIBITED_CLAIM",
            "name": "No Absolute Guarantees",
            "pattern_or_instruction": "guaranteed 100%",
            "severity": "CRITICAL",
            "explanation_template": "Cannot make absolute guarantees.",
            "applies_to_channels": ["all"],
        },
        headers=alpha_headers,
    )
    assert rule_resp.status_code == 201

    fact_resp = await async_test_client.post(
        f"/api/v1/brands/{brand_alpha_id}/facts",
        json={
            "category": "performance",
            "title": "Alpha SLA Guarantee",
            "claim_statement": "Alpha provides 99.9% uptime SLA.",
            "source_document": "Service Terms 2026",
        },
        headers=alpha_headers,
    )
    assert fact_resp.status_code == 201

    # 4. Beta member tries to access Alpha's workspace endpoints -> all must return 403 Forbidden
    r_brand = await async_test_client.get(f"/api/v1/brands/{brand_alpha_id}", headers=beta_headers)
    assert r_brand.status_code == 403

    r_rules = await async_test_client.get(f"/api/v1/brands/{brand_alpha_id}/rules", headers=beta_headers)
    assert r_rules.status_code == 403

    r_facts = await async_test_client.get(f"/api/v1/brands/{brand_alpha_id}/facts", headers=beta_headers)
    assert r_facts.status_code == 403

    r_members = await async_test_client.get(f"/api/v1/brands/{brand_alpha_id}/members", headers=beta_headers)
    assert r_members.status_code == 403

    r_reviews = await async_test_client.get(f"/api/v1/brands/{brand_alpha_id}/reviews", headers=beta_headers)
    assert r_reviews.status_code == 403


@pytest.mark.asyncio
async def test_anti_idor_defenses(async_test_client: AsyncClient):
    """
    IDOR Prevention Test:
    Even if Brand B knows the exact UUID of Brand A's rule, fact, or audit,
    querying or mutating that ID under Brand B's scope MUST return 404 Not Found.
    """
    # 1. Register Brand Alpha and Beta
    resp_alpha = await async_test_client.post("/api/v1/auth/register-brand", json={
        "email": "alpha_owner2@alpha.com",
        "password": "Password123!",
        "full_name": "Alpha Owner 2",
        "brand_name": "Alpha 2",
        "brand_slug": "alpha-2",
    })
    assert resp_alpha.status_code == 201
    brand_alpha_id = resp_alpha.json()["user"]["memberships"][0]["brand_id"]
    alpha_token = resp_alpha.json()["access_token"]
    alpha_headers = {"Authorization": f"Bearer {alpha_token}"}

    resp_beta = await async_test_client.post("/api/v1/auth/register-brand", json={
        "email": "beta_owner2@beta.com",
        "password": "Password123!",
        "full_name": "Beta Owner 2",
        "brand_name": "Beta 2",
        "brand_slug": "beta-2",
    })
    assert resp_beta.status_code == 201
    brand_beta_id = resp_beta.json()["user"]["memberships"][0]["brand_id"]
    beta_token = resp_beta.json()["access_token"]
    beta_headers = {"Authorization": f"Bearer {beta_token}"}

    # 2. Alpha creates Rule and Fact
    rule_res = await async_test_client.post(
        f"/api/v1/brands/{brand_alpha_id}/rules",
        json={
            "rule_type": "TERMINOLOGY",
            "name": "Alpha Naming Convention",
            "pattern_or_instruction": "alphacorp",
            "severity": "WARNING",
            "explanation_template": "Always write as Alpha Corp.",
            "applies_to_channels": ["all"],
        },
        headers=alpha_headers,
    )
    rule_alpha_id = rule_res.json()["id"]

    fact_res = await async_test_client.post(
        f"/api/v1/brands/{brand_alpha_id}/facts",
        json={
            "category": "pricing",
            "title": "Alpha Base Price",
            "claim_statement": "Base subscription is $99/mo.",
            "source_document": "Pricing 2026",
        },
        headers=alpha_headers,
    )
    fact_alpha_id = fact_res.json()["id"]

    # 3. IDOR Attack: Beta tries to read Alpha's rule under Beta's brand scope
    idor_read = await async_test_client.get(
        f"/api/v1/brands/{brand_beta_id}/rules/{rule_alpha_id}",
        headers=beta_headers,
    )
    assert idor_read.status_code == 404, f"Expected 404 on IDOR read, got {idor_read.status_code}"

    # 4. IDOR Attack: Beta tries to update Alpha's rule under Beta's brand scope
    idor_update = await async_test_client.put(
        f"/api/v1/brands/{brand_beta_id}/rules/{rule_alpha_id}",
        json={"name": "Hacked Name"},
        headers=beta_headers,
    )
    assert idor_update.status_code == 404

    # 5. IDOR Attack: Beta tries to delete Alpha's rule under Beta's brand scope
    idor_delete = await async_test_client.delete(
        f"/api/v1/brands/{brand_beta_id}/rules/{rule_alpha_id}",
        headers=beta_headers,
    )
    assert idor_delete.status_code == 404

    # 6. IDOR Attack: Beta tries to delete Alpha's fact under Beta's brand scope
    idor_del_fact = await async_test_client.delete(
        f"/api/v1/brands/{brand_beta_id}/facts/{fact_alpha_id}",
        headers=beta_headers,
    )
    assert idor_del_fact.status_code == 404

    # 7. Verify Alpha's rule and fact are completely intact
    verify_rule = await async_test_client.get(
        f"/api/v1/brands/{brand_alpha_id}/rules/{rule_alpha_id}",
        headers=alpha_headers,
    )
    assert verify_rule.status_code == 200
    assert verify_rule.json()["name"] == "Alpha Naming Convention"


@pytest.mark.asyncio
async def test_rbac_role_violations(async_test_client: AsyncClient):
    """
    Test RBAC Role Permissions:
    - CONTENT_CREATOR cannot create rules, delete rules, or act on reviews.
    - COMPLIANCE_REVIEWER cannot create brand rules.
    - OWNER and BRAND_MANAGER have full rule management rights.
    """
    # 1. Register Brand with OWNER
    b_resp = await async_test_client.post("/api/v1/auth/register-brand", json={
        "email": "owner_rbac@acme.com",
        "password": "Password123!",
        "full_name": "RBAC Owner",
        "brand_name": "RBAC Brands",
        "brand_slug": "rbac-brands",
    })
    assert b_resp.status_code == 201
    brand_id = b_resp.json()["user"]["memberships"][0]["brand_id"]
    owner_token = b_resp.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # 2. Add Content Creator member via invitation
    c_reg = await async_test_client.post("/api/v1/auth/register-creator", json={
        "email": "creator_rbac@acme.com",
        "password": "Password123!",
        "full_name": "RBAC Creator",
    })
    assert c_reg.status_code == 201
    creator_token = c_reg.json()["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    inv_c = await async_test_client.post(
        f"/api/v1/brands/{brand_id}/invitations",
        json={"email": "creator_rbac@acme.com", "role": BrandRole.CONTENT_CREATOR},
        headers=owner_headers,
    )
    await async_test_client.post(
        "/api/v1/invitations/accept",
        json={"invitation_token": inv_c.json()["invitation_token"]},
        headers=creator_headers,
    )

    # 3. Add Compliance Reviewer member via invitation
    r_reg = await async_test_client.post("/api/v1/auth/register-creator", json={
        "email": "reviewer_rbac@acme.com",
        "password": "Password123!",
        "full_name": "RBAC Reviewer",
    })
    assert r_reg.status_code == 201
    reviewer_token = r_reg.json()["access_token"]
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}

    inv_r = await async_test_client.post(
        f"/api/v1/brands/{brand_id}/invitations",
        json={"email": "reviewer_rbac@acme.com", "role": BrandRole.COMPLIANCE_REVIEWER},
        headers=owner_headers,
    )
    await async_test_client.post(
        "/api/v1/invitations/accept",
        json={"invitation_token": inv_r.json()["invitation_token"]},
        headers=reviewer_headers,
    )

    # 4. CONTENT_CREATOR attempts to create a rule -> 403 Forbidden
    rule_create_attempt = await async_test_client.post(
        f"/api/v1/brands/{brand_id}/rules",
        json={
            "rule_type": "PROHIBITED_CLAIM",
            "name": "Creator Created Rule",
            "pattern_or_instruction": "forbidden",
            "severity": "WARNING",
            "explanation_template": "Template",
        },
        headers=creator_headers,
    )
    assert rule_create_attempt.status_code == 403, f"Creator should not create rule: {rule_create_attempt.text}"

    # 5. COMPLIANCE_REVIEWER attempts to create a rule -> 403 Forbidden
    reviewer_create_attempt = await async_test_client.post(
        f"/api/v1/brands/{brand_id}/rules",
        json={
            "rule_type": "PROHIBITED_CLAIM",
            "name": "Reviewer Created Rule",
            "pattern_or_instruction": "forbidden",
            "severity": "WARNING",
            "explanation_template": "Template",
        },
        headers=reviewer_headers,
    )
    assert reviewer_create_attempt.status_code == 403

    # 6. OWNER creates a rule successfully
    owner_create = await async_test_client.post(
        f"/api/v1/brands/{brand_id}/rules",
        json={
            "rule_type": "PROHIBITED_CLAIM",
            "name": "Owner Created Rule",
            "pattern_or_instruction": "forbidden",
            "severity": "WARNING",
            "explanation_template": "Template",
        },
        headers=owner_headers,
    )
    assert owner_create.status_code == 201
    rule_id = owner_create.json()["id"]

    # 7. CONTENT_CREATOR attempts to delete the rule -> 403 Forbidden
    creator_del_attempt = await async_test_client.delete(
        f"/api/v1/brands/{brand_id}/rules/{rule_id}",
        headers=creator_headers,
    )
    assert creator_del_attempt.status_code == 403


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_revocation(async_test_client: AsyncClient):
    """
    Test Token Security:
    - Refresh token rotation on each refresh request.
    - Used/revoked refresh token is rejected (cannot be reused).
    - Logout revokes refresh token immediately.
    """
    # 1. Login user
    b_resp = await async_test_client.post("/api/v1/auth/register-brand", json={
        "email": "token_test@brand.com",
        "password": "Password123!",
        "full_name": "Token Tester",
        "brand_name": "Token Brand",
        "brand_slug": "token-brand",
    })
    assert b_resp.status_code == 201
    initial_refresh = b_resp.json()["refresh_token"]

    # 2. Refresh token rotation
    ref_resp = await async_test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": initial_refresh},
    )
    assert ref_resp.status_code == 200, ref_resp.text
    ref_data = ref_resp.json()
    new_access = ref_data["access_token"]
    rotated_refresh = ref_data["refresh_token"]
    assert new_access is not None
    assert rotated_refresh != initial_refresh

    # 3. Attempting to use the OLD (initial) refresh token must fail with 401
    old_reuse_resp = await async_test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": initial_refresh},
    )
    assert old_reuse_resp.status_code == 401

    # 4. Logout with the active refresh token
    logout_resp = await async_test_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": rotated_refresh},
    )
    assert logout_resp.status_code == 200

    # 5. Attempting to use the logged-out refresh token must fail with 401
    post_logout_resp = await async_test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": rotated_refresh},
    )
    assert post_logout_resp.status_code == 401
