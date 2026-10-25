import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.fact import GoldenFact
from app.core.permissions import Permission
from app.api.deps import require_permission, TenantContext

router = APIRouter()


class GoldenFactCreateRequest(BaseModel):
    category: str = "general"
    title: str
    claim_statement: str
    source_document: str = "Brand Guidelines"


class GoldenFactResponse(BaseModel):
    id: str
    brand_id: str
    category: str
    title: str
    claim_statement: str
    source_document: str
    is_active: bool


@router.get("/{brand_id}/facts", response_model=List[GoldenFactResponse])
async def list_golden_facts(
    brand_id: uuid.UUID,
    category: Optional[str] = None,
    tenant: TenantContext = Depends(require_permission(Permission.FACTS_READ)),
    db: AsyncSession = Depends(get_db),
):
    """Lists golden facts strictly for the verified tenant."""
    query = select(GoldenFact).where(GoldenFact.brand_id == tenant.brand_id, GoldenFact.is_active.is_(True))
    if category:
        query = query.where(GoldenFact.category == category)
    res = await db.execute(query.order_by(GoldenFact.created_at.desc()))
    return [
        GoldenFactResponse(
            id=str(f.id),
            brand_id=str(f.brand_id),
            category=f.category,
            title=f.title,
            claim_statement=f.claim_statement,
            source_document=f.source_document,
            is_active=f.is_active,
        )
        for f in res.scalars().all()
    ]


@router.get("/{brand_id}/facts/{fact_id}", response_model=GoldenFactResponse)
async def get_golden_fact(
    brand_id: uuid.UUID,
    fact_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.FACTS_READ)),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a single golden fact. Prevents IDOR by querying with tenant brand_id."""
    res = await db.execute(
        select(GoldenFact).where(
            GoldenFact.id == fact_id,
            GoldenFact.brand_id == tenant.brand_id,
        )
    )
    fact = res.scalars().first()
    if not fact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact not found in this brand workspace")

    return GoldenFactResponse(
        id=str(fact.id),
        brand_id=str(fact.brand_id),
        category=fact.category,
        title=fact.title,
        claim_statement=fact.claim_statement,
        source_document=fact.source_document,
        is_active=fact.is_active,
    )


@router.post("/{brand_id}/facts", response_model=GoldenFactResponse, status_code=status.HTTP_201_CREATED)
async def create_golden_fact(
    brand_id: uuid.UUID,
    payload: GoldenFactCreateRequest,
    tenant: TenantContext = Depends(require_permission(Permission.FACTS_CREATE)),
    db: AsyncSession = Depends(get_db),
):
    """Indexes a new golden fact under the tenant."""
    fact = GoldenFact(
        brand_id=tenant.brand_id,
        category=payload.category,
        title=payload.title.strip(),
        claim_statement=payload.claim_statement.strip(),
        source_document=payload.source_document.strip(),
    )
    db.add(fact)
    await db.commit()
    await db.refresh(fact)

    return GoldenFactResponse(
        id=str(fact.id),
        brand_id=str(fact.brand_id),
        category=fact.category,
        title=fact.title,
        claim_statement=fact.claim_statement,
        source_document=fact.source_document,
        is_active=fact.is_active,
    )


@router.delete("/{brand_id}/facts/{fact_id}")
async def delete_golden_fact(
    brand_id: uuid.UUID,
    fact_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.FACTS_DELETE)),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a golden fact. Prevents IDOR."""
    res = await db.execute(
        select(GoldenFact).where(
            GoldenFact.id == fact_id,
            GoldenFact.brand_id == tenant.brand_id,
        )
    )
    fact = res.scalars().first()
    if not fact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact not found in this brand workspace")

    await db.delete(fact)
    await db.commit()
    return {"message": "Fact deleted successfully"}
