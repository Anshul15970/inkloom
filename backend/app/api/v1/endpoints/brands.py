import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.brand import Brand, BrandMembership, BrandRole
from app.api.deps import get_current_user

router = APIRouter()


class BrandCreateRequest(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    website: Optional[str] = ""


class BrandResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    website: str
    user_role: Optional[str] = None


@router.post("", response_model=BrandResponse)
async def create_brand(
    payload: BrandCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if slug exists
    res = await db.execute(select(Brand).where(Brand.slug == payload.slug))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand slug '{payload.slug}' already exists",
        )

    brand = Brand(
        name=payload.name,
        slug=payload.slug.lower().strip(),
        description=payload.description or "",
        website=payload.website or "",
    )
    db.add(brand)
    await db.flush()

    # Automatically grant creator the BRAND_MANAGER role
    membership = BrandMembership(
        user_id=current_user.id,
        brand_id=brand.id,
        role=BrandRole.BRAND_MANAGER,
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
        user_role=BrandRole.BRAND_MANAGER,
    )


@router.get("", response_model=List[BrandResponse])
async def list_user_brands(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
                user_role=BrandRole.BRAND_MANAGER,
            )
            for b in brands
        ]

    res = await db.execute(
        select(Brand, BrandMembership.role)
        .join(BrandMembership, BrandMembership.brand_id == Brand.id)
        .where(BrandMembership.user_id == current_user.id)
    )
    output = []
    for brand, role in res.all():
        output.append(
            BrandResponse(
                id=str(brand.id),
                name=brand.name,
                slug=brand.slug,
                description=brand.description,
                website=brand.website,
                user_role=role,
            )
        )
    return output

