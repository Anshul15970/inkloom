import uuid
from typing import Optional, Callable
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import TenantAccessDeniedException, InsufficientPermissionsException, AuthenticationFailedException
from app.core.permissions import Permission, has_permission
from app.db.session import get_db
from app.models.user import User
from app.models.brand import Brand, BrandMembership, BrandRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type", "access")
        if not user_id_str or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = uuid.UUID(user_id_str)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
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

    def check_permission(self, permission: Permission) -> bool:
        if self.user.is_superuser:
            return True
        return has_permission(self.role, permission)


async def get_tenant_context(
    brand_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    """Enforces tenant boundary: verifies that the authenticated user belongs to the target brand."""
    # Check brand exists
    b_res = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = b_res.scalars().first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand workspace not found",
        )

    # Superuser has master access as OWNER
    if current_user.is_superuser:
        dummy_mem = BrandMembership(user_id=current_user.id, brand_id=brand.id, role=BrandRole.OWNER)
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
        raise TenantAccessDeniedException(f"You do not have authorized access to brand '{brand.name}'")

    return TenantContext(brand=brand, membership=membership, user=current_user)


def require_permission(permission: Permission) -> Callable:
    """Dependency factory enforcing granular role permissions within a verified tenant context."""
    async def permission_checker(tenant: TenantContext = Depends(get_tenant_context)) -> TenantContext:
        if not tenant.check_permission(permission):
            raise InsufficientPermissionsException(
                f"Role '{tenant.role}' does not have the required permission '{permission.value}'"
            )
        return tenant
    return permission_checker
