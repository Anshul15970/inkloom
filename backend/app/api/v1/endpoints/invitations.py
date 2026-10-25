from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.brand import Brand, BrandMembership
from app.models.invitation import BrandInvitation, InvitationStatus
from app.core.security import hash_token
from app.api.deps import get_current_user

router = APIRouter()


class VerifyInvitationResponse(BaseModel):
    brand_name: str
    brand_slug: str
    invited_email: str
    role: str
    is_valid: bool


class AcceptInvitationRequest(BaseModel):
    token: str


class AcceptInvitationResponse(BaseModel):
    brand_id: str
    brand_name: str
    role: str
    message: str


@router.get("/verify", response_model=VerifyInvitationResponse)
async def verify_invitation(token: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint to verify an invitation token before signing up or accepting."""
    token_h = hash_token(token.strip())
    res = await db.execute(
        select(BrandInvitation, Brand)
        .join(Brand, Brand.id == BrandInvitation.brand_id)
        .where(BrandInvitation.token_hash == token_h)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    invitation, brand = row
    if not invitation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is no longer active (status: {invitation.status})",
        )

    return VerifyInvitationResponse(
        brand_name=brand.name,
        brand_slug=brand.slug,
        invited_email=invitation.email,
        role=invitation.role,
        is_valid=True,
    )


@router.post("/accept", response_model=AcceptInvitationResponse)
async def accept_invitation(
    payload: AcceptInvitationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Authenticated endpoint: user accepts an invitation token to join a brand workspace."""
    token_h = hash_token(payload.token.strip())
    res = await db.execute(
        select(BrandInvitation, Brand)
        .join(Brand, Brand.id == BrandInvitation.brand_id)
        .where(BrandInvitation.token_hash == token_h)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    invitation, brand = row
    if not invitation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is no longer active (status: {invitation.status})",
        )

    # Check if already a member
    mem_res = await db.execute(
        select(BrandMembership).where(
            BrandMembership.brand_id == invitation.brand_id,
            BrandMembership.user_id == current_user.id,
        )
    )
    existing_mem = mem_res.scalars().first()
    if existing_mem:
        invitation.status = InvitationStatus.ACCEPTED
        await db.commit()
        return AcceptInvitationResponse(
            brand_id=str(brand.id),
            brand_name=brand.name,
            role=existing_mem.role,
            message="You are already an authorized member of this brand workspace.",
        )

    # Assign membership
    membership = BrandMembership(
        user_id=current_user.id,
        brand_id=invitation.brand_id,
        role=invitation.role,
    )
    invitation.status = InvitationStatus.ACCEPTED
    db.add(membership)
    await db.commit()

    return AcceptInvitationResponse(
        brand_id=str(brand.id),
        brand_name=brand.name,
        role=invitation.role,
        message=f"Successfully joined {brand.name} as {invitation.role}.",
    )
