import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.brand import BrandMembership, Brand
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.exceptions import AuthenticationFailedException

router = APIRouter()


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user=UserProfileResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            memberships=[],
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise AuthenticationFailedException()

    # Fetch memberships
    mem_res = await db.execute(
        select(BrandMembership, Brand)
        .join(Brand, Brand.id == BrandMembership.brand_id)
        .where(BrandMembership.user_id == user.id)
    )
    memberships = []
    for mem, br in mem_res.all():
        memberships.append(
            BrandMembershipDTO(
                brand_id=str(br.id),
                brand_name=br.name,
                brand_slug=br.slug,
                role=mem.role,
            )
        )

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user=UserProfileResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            memberships=memberships,
        )
    )

