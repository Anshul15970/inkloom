import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.brand import Brand, BrandMembership, BrandRole
from app.models.invitation import BrandInvitation, InvitationStatus
from app.core.security import hash_token
from app.core.permissions import Permission
from app.api.deps import get_current_user, get_tenant_context, require_permission, TenantContext

router = APIRouter()


# Schemas
class BrandCreateRequest(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    website: Optional[str] = ""


class BrandUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None


class BrandResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    website: str
    user_role: Optional[str] = None


class MemberResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    joined_at: str


class InvitationCreateRequest(BaseModel):
    email: EmailStr
    role: str  # BRAND_MANAGER, COMPLIANCE_REVIEWER, CONTENT_CREATOR


class InvitationResponse(BaseModel):
    id: str
    brand_id: str
    email: str
    role: str
    status: str
    expires_at: str
    invitation_token: Optional[str] = None


@router.get("", response_model=List[BrandResponse])
async def list_user_brands(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all brands the authenticated user belongs to."""
    if current_user.is_superuser:
        res = await db.execute(select(Brand))
        brands = res.scalars().all()
        return [
            BrandResponse(
                id=str(b.id),
                name=b.name,
                slug=b.slug,
                description=b.description,
                website=b.website,
                user_role=BrandRole.OWNER,
            )
            for b in brands
        ]

    res = await db.execute(
        select(Brand, BrandMembership.role)
        .join(BrandMembership, BrandMembership.brand_id == Brand.id)
        .where(BrandMembership.user_id == current_user.id)
    )
    return [
        BrandResponse(
            id=str(brand.id),
            name=brand.name,
            slug=brand.slug,
            description=brand.description,
            website=brand.website,
            user_role=role,
        )
        for brand, role in res.all()
    ]


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    payload: BrandCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new brand organization and assigns creator as OWNER."""
    slug = payload.slug.lower().strip()
    res = await db.execute(select(Brand).where(Brand.slug == slug))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand slug '{slug}' is already in use",
        )

    brand = Brand(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description or "",
        website=payload.website or "",
    )
    db.add(brand)
    await db.flush()

    membership = BrandMembership(
        user_id=current_user.id,
        brand_id=brand.id,
        role=BrandRole.OWNER,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(brand)

    return BrandResponse(
        id=str(brand.id),
        name=brand.name,
        slug=brand.slug,
        description=brand.description,
        website=brand.website,
        user_role=BrandRole.OWNER,
    )


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: uuid.UUID,
    tenant: TenantContext = Depends(get_tenant_context),
):
    """Retrieves brand workspace details. Strictly scoped to authorized members."""
    return BrandResponse(
        id=str(tenant.brand.id),
        name=tenant.brand.name,
        slug=tenant.brand.slug,
        description=tenant.brand.description,
        website=tenant.brand.website,
        user_role=tenant.role,
    )


@router.put("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: uuid.UUID,
    payload: BrandUpdateRequest,
    tenant: TenantContext = Depends(require_permission(Permission.BRAND_UPDATE)),
    db: AsyncSession = Depends(get_db),
):
    """Updates brand profile. Requires BRAND_UPDATE permission."""
    if payload.name is not None:
        tenant.brand.name = payload.name.strip()
    if payload.description is not None:
        tenant.brand.description = payload.description.strip()
    if payload.website is not None:
        tenant.brand.website = payload.website.strip()

    await db.commit()
    await db.refresh(tenant.brand)

    return BrandResponse(
        id=str(tenant.brand.id),
        name=tenant.brand.name,
        slug=tenant.brand.slug,
        description=tenant.brand.description,
        website=tenant.brand.website,
        user_role=tenant.role,
    )


@router.get("/{brand_id}/members", response_model=List[MemberResponse])
async def list_members(
    brand_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.MEMBERS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """Lists authorized members in this brand workspace."""
    res = await db.execute(
        select(BrandMembership, User)
        .join(User, User.id == BrandMembership.user_id)
        .where(BrandMembership.brand_id == tenant.brand_id)
        .order_by(BrandMembership.created_at.asc())
    )
    return [
        MemberResponse(
            user_id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=mem.role,
            joined_at=mem.created_at.isoformat() if mem.created_at else "",
        )
        for mem, u in res.all()
    ]


@router.delete("/{brand_id}/members/{user_id}")
async def remove_member(
    brand_id: uuid.UUID,
    user_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.MEMBERS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """Removes a member from this brand tenant. Prevents removing the last OWNER."""
    mem_res = await db.execute(
        select(BrandMembership).where(
            BrandMembership.brand_id == tenant.brand_id,
            BrandMembership.user_id == user_id,
        )
    )
    target_mem = mem_res.scalars().first()
    if not target_mem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this brand")

    # If target is OWNER, check if there are other owners
    if target_mem.role == BrandRole.OWNER:
        owners_res = await db.execute(
            select(BrandMembership).where(
                BrandMembership.brand_id == tenant.brand_id,
                BrandMembership.role == BrandRole.OWNER,
            )
        )
        owners = owners_res.scalars().all()
        if len(owners) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the only owner of this brand workspace",
            )

    await db.delete(target_mem)
    await db.commit()
    return {"message": "Member removed successfully"}


@router.post("/{brand_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    brand_id: uuid.UUID,
    payload: InvitationCreateRequest,
    tenant: TenantContext = Depends(require_permission(Permission.MEMBERS_INVITE)),
    db: AsyncSession = Depends(get_db),
):
    """Invites a new member to the brand. Generates a secure invitation token."""
    # Prevent non-owners from inviting an OWNER
    if payload.role == BrandRole.OWNER and tenant.role != BrandRole.OWNER and not tenant.user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only brand owners can invite another owner",
        )

    # Check if already a member
    existing_user_res = await db.execute(select(User).where(User.email == payload.email.lower()))
    existing_user = existing_user_res.scalars().first()
    if existing_user:
        existing_mem = await db.execute(
            select(BrandMembership).where(
                BrandMembership.brand_id == tenant.brand_id,
                BrandMembership.user_id == existing_user.id,
            )
        )
        if existing_mem.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this brand workspace",
            )

    raw_token = secrets.token_urlsafe(32)
    invitation = BrandInvitation(
        brand_id=tenant.brand_id,
        email=payload.email.lower(),
        role=payload.role,
        token_hash=hash_token(raw_token),
        created_by_id=tenant.user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    return InvitationResponse(
        id=str(invitation.id),
        brand_id=str(invitation.brand_id),
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        expires_at=invitation.expires_at.isoformat(),
        invitation_token=raw_token,
    )


@router.get("/{brand_id}/invitations", response_model=List[InvitationResponse])
async def list_invitations(
    brand_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.MEMBERS_INVITE)),
    db: AsyncSession = Depends(get_db),
):
    """Lists pending invitations for this brand workspace."""
    res = await db.execute(
        select(BrandInvitation).where(
            BrandInvitation.brand_id == tenant.brand_id,
            BrandInvitation.status == InvitationStatus.PENDING,
        )
    )
    return [
        InvitationResponse(
            id=str(inv.id),
            brand_id=str(inv.brand_id),
            email=inv.email,
            role=inv.role,
            status=inv.status,
            expires_at=inv.expires_at.isoformat(),
            invitation_token=None,
        )
        for inv in res.scalars().all()
    ]


@router.delete("/{brand_id}/invitations/{invitation_id}")
async def revoke_invitation(
    brand_id: uuid.UUID,
    invitation_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.MEMBERS_INVITE)),
    db: AsyncSession = Depends(get_db),
):
    """Revokes a pending invitation."""
    res = await db.execute(
        select(BrandInvitation).where(
            BrandInvitation.id == invitation_id,
            BrandInvitation.brand_id == tenant.brand_id,
        )
    )
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    inv.status = InvitationStatus.REVOKED
    await db.commit()
    return {"message": "Invitation revoked successfully"}
