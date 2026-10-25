import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.rule import BrandRule, VisualAsset, RuleSeverity, RuleType
from app.api.deps import get_tenant_context, TenantContext

router = APIRouter()


class BrandRuleCreateRequest(BaseModel):
    rule_type: str
    name: str
    pattern_or_instruction: str
    severity: str = RuleSeverity.WARNING
    explanation_template: str
    applies_to_channels: List[str] = ["all"]


class BrandRuleResponse(BaseModel):
    id: str
    brand_id: str
    rule_type: str
    name: str
    pattern_or_instruction: str
    severity: str
    explanation_template: str
    applies_to_channels: List[str]
    is_active: bool


@router.get("/{brand_id}/rules", response_model=List[BrandRuleResponse])
async def list_brand_rules(
    brand_id: uuid.UUID,
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(BrandRule).where(BrandRule.brand_id == tenant.brand_id, BrandRule.is_active.is_(True))
    )
    rules = res.scalars().all()
    return [
        BrandRuleResponse(
            id=str(r.id),
            brand_id=str(r.brand_id),
            rule_type=r.rule_type,
            name=r.name,
            pattern_or_instruction=r.pattern_or_instruction,
            severity=r.severity,
            explanation_template=r.explanation_template,
            applies_to_channels=r.applies_to_channels,
            is_active=r.is_active,
        )
        for r in rules
    ]


@router.post("/{brand_id}/rules", response_model=BrandRuleResponse)
async def create_brand_rule(
    brand_id: uuid.UUID,
    payload: BrandRuleCreateRequest,
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    rule = BrandRule(
        brand_id=tenant.brand_id,
        rule_type=payload.rule_type,
        name=payload.name,
        pattern_or_instruction=payload.pattern_or_instruction,
        severity=payload.severity,
        explanation_template=payload.explanation_template,
        applies_to_channels=payload.applies_to_channels,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    return BrandRuleResponse(
        id=str(rule.id),
        brand_id=str(rule.brand_id),
        rule_type=rule.rule_type,
        name=rule.name,
        pattern_or_instruction=rule.pattern_or_instruction,
        severity=rule.severity,
        explanation_template=rule.explanation_template,
        applies_to_channels=rule.applies_to_channels,
        is_active=rule.is_active,
    )

