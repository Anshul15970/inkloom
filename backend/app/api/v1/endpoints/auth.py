import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token_string,
    hash_token,
    validate_password_strength,
)
from app.core.exceptions import AuthenticationFailedException
from app.db.session import get_db
from app.models.user import User
from app.models.token import RefreshToken
from app.models.brand import Brand, BrandMembership, BrandRole
from app.models.invitation import BrandInvitation, InvitationStatus
from app.api.deps import get_current_user

router = APIRouter()


# Schemas
class BrandRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    brand_name: str
    brand_slug: str
    website: Optional[str] = ""


class CreatorRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    invitation_token: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: str


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class BrandMembershipDTO(BaseModel):
    brand_id: str
    brand_name: str
    brand_slug: str
    role: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    is_superuser: bool
    memberships: List[BrandMembershipDTO]


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserProfileResponse


async def _issue_token_pair(user: User, db: AsyncSession) -> AuthTokenResponse:
    # 1. Access token (1 hour)
    access_token = create_access_token(subject=user.id)

    # 2. Refresh token (30 days)
    raw_refresh = create_refresh_token_string()
    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)
    await db.commit()

    # 3. Load active brand memberships
    mem_res = await db.execute(
        select(BrandMembership, Brand)
        .join(Brand, Brand.id == BrandMembership.brand_id)
        .where(BrandMembership.user_id == user.id)
    )
    memberships = [
        BrandMembershipDTO(
            brand_id=str(br.id),
            brand_name=br.name,
            brand_slug=br.slug,
            role=mem.role,
        )
        for mem, br in mem_res.all()
    ]

    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserProfileResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            memberships=memberships,
        ),
    )


@router.post("/register-brand", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_brand(payload: BrandRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Registers a new brand organization and creates its initial OWNER account."""
    pwd_err = validate_password_strength(payload.password)
    if pwd_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_err)

    # Check user email collision
    existing_user = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Check brand slug collision
    slug = payload.brand_slug.lower().strip()
    existing_slug = await db.execute(select(Brand).where(Brand.slug == slug))
    if existing_slug.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand identifier '{slug}' is already taken",
        )

    # Create User
    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
    )
    db.add(user)
    await db.flush()

    # Create Brand
    brand = Brand(
        name=payload.brand_name.strip(),
        slug=slug,
        website=payload.website or "",
    )
    db.add(brand)
    await db.flush()

    # Assign OWNER membership
    membership = BrandMembership(
        user_id=user.id,
        brand_id=brand.id,
        role=BrandRole.OWNER,
    )
    db.add(membership)
    await db.flush()

    return await _issue_token_pair(user, db)


@router.post("/register-creator", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_creator(payload: CreatorRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Registers an individual creator. Can atomically accept a brand invitation token."""
    pwd_err = validate_password_strength(payload.password)
    if pwd_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_err)

    existing_user = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # If invitation token provided, validate it first
    invitation = None
    if payload.invitation_token:
        token_h = hash_token(payload.invitation_token.strip())
        inv_res = await db.execute(
            select(BrandInvitation).where(
                BrandInvitation.token_hash == token_h,
                BrandInvitation.status == InvitationStatus.PENDING,
            )
        )
        invitation = inv_res.scalars().first()
        if not invitation or not invitation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation token is invalid, expired, or already used",
            )

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
    )
    db.add(user)
    await db.flush()

    # Assign invited membership if valid
    if invitation:
        membership = BrandMembership(
            user_id=user.id,
            brand_id=invitation.brand_id,
            role=invitation.role,
        )
        invitation.status = InvitationStatus.ACCEPTED
        db.add(membership)
        await db.flush()

    return await _issue_token_pair(user, db)


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticates user with email and password, issuing access and refresh tokens."""
    res = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = res.scalars().first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise AuthenticationFailedException("Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return await _issue_token_pair(user, db)


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh_tokens(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refreshes access token and rotates the refresh token."""
    token_h = hash_token(payload.refresh_token.strip())
    res = await db.execute(
        select(RefreshToken, User)
        .join(User, User.id == RefreshToken.user_id)
        .where(RefreshToken.token_hash == token_h)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    token_record, user = row
    if not token_record.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or expired. Please sign in again.",
        )

    # Revoke old refresh token (rotation)
    token_record.revoked_at = datetime.now(timezone.utc)
    await db.flush()

    return await _issue_token_pair(user, db)


@router.post("/logout")
async def logout(payload: LogoutRequest, db: AsyncSession = Depends(get_db)):
    """Revokes the active refresh token."""
    if payload.refresh_token:
        token_h = hash_token(payload.refresh_token.strip())
        res = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_h))
        token_record = res.scalars().first()
        if token_record:
            token_record.revoked_at = datetime.now(timezone.utc)
            await db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves authenticated user profile and all authorized brand workspaces."""
    mem_res = await db.execute(
        select(BrandMembership, Brand)
        .join(Brand, Brand.id == BrandMembership.brand_id)
        .where(BrandMembership.user_id == current_user.id)
    )
    memberships = [
        BrandMembershipDTO(
            brand_id=str(br.id),
            brand_name=br.name,
            brand_slug=br.slug,
            role=mem.role,
        )
        for mem, br in mem_res.all()
    ]

    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        memberships=memberships,
    )


@router.put("/me/profile", response_model=UserProfileResponse)
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates user personal details."""
    current_user.full_name = payload.full_name.strip()
    await db.commit()
    await db.refresh(current_user)

    mem_res = await db.execute(
        select(BrandMembership, Brand)
        .join(Brand, Brand.id == BrandMembership.brand_id)
        .where(BrandMembership.user_id == current_user.id)
    )
    memberships = [
        BrandMembershipDTO(
            brand_id=str(br.id),
            brand_name=br.name,
            brand_slug=br.slug,
            role=mem.role,
        )
        for mem, br in mem_res.all()
    ]

    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        memberships=memberships,
    )


@router.put("/me/password")
async def update_password(
    payload: UpdatePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Secure password change requiring existing password verification."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    pwd_err = validate_password_strength(payload.new_password)
    if pwd_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_err)

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}
