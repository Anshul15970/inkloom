import uuid
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import TenantAccessDeniedException, AuthenticationFailedException
from app.db.session import get_db
from app.models.user import User
from app.models.brand import Brand, BrandMembership, BrandRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise AuthenticationFailedException("Authentication required")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise AuthenticationFailedException("Token subject missing")
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise AuthenticationFailedException("Invalid authentication token")

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalars().first()
    if not user:
        raise AuthenticationFailedException("User not found or inactive")
    return user


class TenantContext:
    def __init__(self, brand: Brand, membership: BrandMembership, user: User):
        self.brand = brand
        self.membership = membership
        self.user = user

    @property
    def brand_id(self) -> uuid.UUID:
        return self.brand.id

    @property
    def role(self) -> str:
        return self.membership.role


async def get_tenant_context(
    brand_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    """Enforces tenant boundary: verifies that the authenticated user belongs to the target brand."""
    # Check brand existence
    b_res = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = b_res.scalars().first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand workspace not found")

    # If superuser, grant full access as Brand Manager
    if current_user.is_superuser:
        dummy_mem = BrandMembership(user_id=current_user.id, brand_id=brand.id, role=BrandRole.BRAND_MANAGER)
        return TenantContext(brand=brand, membership=dummy_mem, user=current_user)

    # Check user membership in this brand
    m_res = await db.execute(
        select(BrandMembership).where(
            BrandMembership.user_id == current_user.id,
            BrandMembership.brand_id == brand.id,
        )
    )
    membership = m_res.scalars().first()
    if not membership:
        raise TenantAccessDeniedException(f"User is not a member of brand {brand.name}")

    return TenantContext(brand=brand, membership=membership, user=current_user)
