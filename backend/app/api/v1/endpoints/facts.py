import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.fact import GoldenFact
from app.api.deps import get_tenant_context, TenantContext

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
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    query = select(GoldenFact).where(GoldenFact.brand_id == tenant.brand_id, GoldenFact.is_active.is_(True))
    if category:
        query = query.where(GoldenFact.category == category)
    res = await db.execute(query)
    facts = res.scalars().all()
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
        for f in facts
    ]


@router.post("/{brand_id}/facts", response_model=GoldenFactResponse)
async def create_golden_fact(
    brand_id: uuid.UUID,
    payload: GoldenFactCreateRequest,
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    fact = GoldenFact(
        brand_id=tenant.brand_id,
        category=payload.category,
        title=payload.title,
        claim_statement=payload.claim_statement,
        source_document=payload.source_document,
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

