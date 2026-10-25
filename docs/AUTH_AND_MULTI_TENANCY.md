# Inkloom Authentication & Multi-Tenant Authorization Architecture

## 1. Overview
Inkloom is a multi-tenant AI brand governance platform. Organizations register their independent brand workspaces, maintaining private Golden Facts, brand guidelines, visual assets, and audit logs. The authentication and authorization architecture guarantees strict tenant isolation, preventing Insecure Direct Object Reference (IDOR) attacks, cross-tenant leaks, role escalation, and unauthorized access.

---

## 2. Multi-Tenant Architecture & Tenant Isolation Strategy

### 2.1 Schema & Association
Every brand-scoped resource (`golden_facts`, `golden_fact_embeddings`, `brand_rules`, `visual_assets`, `audit_records`, `audit_findings`, `review_items`, `brand_invitations`) carries a mandatory `brand_id` foreign key mapped to `brands.id` with `ondelete="CASCADE"`.

```
User (1) <---> (N) BrandMembership (N) <---> (1) Brand
                       |
               [role: OWNER | BRAND_MANAGER | COMPLIANCE_REVIEWER | CONTENT_CREATOR]
```

### 2.2 Deep Query-Level Tenant Scoping (Anti-IDOR Defense)
Tenant isolation is enforced in the **database query layer and FastAPI dependency injection pipeline**, never relying on frontend-submitted state:

1. **Workspace Boundary Verification (`get_tenant_context`)**:
   - Every brand endpoint takes `brand_id: uuid.UUID`.
   - Dependency `get_tenant_context` retrieves the authenticated user's active membership for that `brand_id`.
   - If the user does not belong to the brand, a `403 Forbidden` (`"You do not have authorized access to brand '...'`) is raised immediately before any business logic executes.

2. **Scoped Resource Queries (Anti-IDOR)**:
   - All CRUD operations on individual records filter strictly by **both** resource ID and `brand_id`:
     ```python
     stmt = select(BrandRule).where(
         BrandRule.id == rule_id,
         BrandRule.brand_id == tenant.brand_id,
     )
     ```
   - If a member of Brand B attempts to inspect, modify, or delete a resource owned by Brand A using its known UUID, the database query returns `None`, resulting in `404 Not Found`.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Permission | OWNER | BRAND_MANAGER | COMPLIANCE_REVIEWER | CONTENT_CREATOR | Description |
|:---|:---:|:---:|:---:|:---:|:---|
| `brand:update` | Yes | Yes | No | No | Edit brand identity & guidelines |
| `members:view` | Yes | Yes | Yes | Yes | List active brand members |
| `members:invite` | Yes | Yes | No | No | Issue cryptographic brand invitations |
| `members:manage` | Yes | No | No | No | Revoke access / remove members |
| `rules:read` | Yes | Yes | Yes | Yes | Read brand rules & guardrails |
| `rules:write` | Yes | Yes | No | No | Create, update, or delete rules |
| `facts:read` | Yes | Yes | Yes | Yes | Search & read Golden Facts |
| `facts:write` | Yes | Yes | No | No | Ingest, create, delete Golden Facts |
| `audit:run` | Yes | Yes | Yes | Yes | Execute text/image compliance audits |
| `reviews:view` | Yes | Yes | Yes | No | View compliance review queue |
| `reviews:act` | Yes | Yes | Yes | No | Approve, reject, or request changes |

---

## 4. Authentication & Token Lifecycle

### 4.1 Token Dual-Model
- **Access Tokens**: Short-lived (60 minutes) JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`). Contains user UUID subject (`sub`), token `type: access`, and expiration (`exp`).
- **Refresh Tokens**: Long-lived (30 days) cryptographically random strings (`secrets.token_urlsafe(48)`). Only the SHA-256 hash is persisted in the `refresh_tokens` database table.

### 4.2 Refresh Token Rotation & Revocation
- **Automatic Rotation**: On every `/api/v1/auth/refresh` invocation, the presented refresh token is immediately revoked, and a brand-new token pair is issued.
- **Replay Protection**: Attempting to reuse a previously rotated or revoked refresh token results in immediate `401 Unauthorized`.
- **Explicit Logout**: `/api/v1/auth/logout` marks the token's `revoked_at` timestamp, terminating the session.

### 4.3 Password Security
- Bcrypt password hashing (`rounds=12`) with automatic 72-byte boundary compliance.
- Password strength validator requires minimum 8 characters, at least one uppercase letter, one lowercase letter, and one digit.

---

## 5. Automated Verification Test Suite

The test suite in [`backend/tests/test_tenant_isolation.py`](file:///e:/Projects/inkloom/backend/tests/test_tenant_isolation.py) provides 100% automated test coverage of:
1. `test_unauthenticated_requests_blocked`: Accessing protected routes without tokens returns 401.
2. `test_brand_and_creator_registration_flow`: Brand registration creates an isolated organization and OWNER membership; creator registration creates an unassigned user.
3. `test_invitation_lifecycle_and_acceptance`: Cryptographic invitation issuance, verification, and role-scoped acceptance.
4. `test_cross_tenant_isolation`: Brand B members cannot read Brand A rules, facts, review queues, or members (403 Forbidden).
5. `test_anti_idor_defenses`: Brand B members passing Brand A's known UUIDs inside Brand B scopes receive 404 Not Found without leaking existence.
6. `test_rbac_role_violations`: Content Creators and Reviewers cannot create or delete rules; unauthorized role escalations are blocked.
7. `test_refresh_token_rotation_and_revocation`: Rotated tokens cannot be replayed; logged-out tokens are immediately invalid.

To execute the test suite:
```bash
.\backend\.venv\Scripts\pytest.exe -c backend/pytest.ini backend/tests/test_tenant_isolation.py
```

---

## 6. Local Development & Setup

### 6.1 Backend Setup
1. Activate virtual environment:
   ```powershell
   .\backend\.venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Copy environment configuration:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
4. Start development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 6.2 Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Build or start Vite dev server:
   ```bash
   npm run dev
   # or build production bundle:
   npm run build
   ```
