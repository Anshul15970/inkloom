import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.rule import BrandRule, RuleSeverity, RuleType
from app.core.permissions import Permission
from app.api.deps import require_permission, TenantContext

router = APIRouter()


class BrandRuleCreateRequest(BaseModel):
    rule_type: str
    name: str
    pattern_or_instruction: str
    severity: str = RuleSeverity.WARNING
    explanation_template: str
    applies_to_channels: List[str] = ["all"]


class BrandRuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    pattern_or_instruction: Optional[str] = None
    severity: Optional[str] = None
    explanation_template: Optional[str] = None
    applies_to_channels: Optional[List[str]] = None
    is_active: Optional[bool] = None


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
    tenant: TenantContext = Depends(require_permission(Permission.RULES_READ)),
    db: AsyncSession = Depends(get_db),
):
    """Lists rules for the verified brand tenant."""
    res = await db.execute(
        select(BrandRule)
        .where(BrandRule.brand_id == tenant.brand_id, BrandRule.is_active.is_(True))
        .order_by(BrandRule.created_at.desc())
    )
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
        for r in res.scalars().all()
    ]


@router.get("/{brand_id}/rules/{rule_id}", response_model=BrandRuleResponse)
async def get_brand_rule(
    brand_id: uuid.UUID,
    rule_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.RULES_READ)),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a single rule. Strictly scopes by tenant brand_id to prevent IDOR."""
    res = await db.execute(
        select(BrandRule).where(
            BrandRule.id == rule_id,
            BrandRule.brand_id == tenant.brand_id,
        )
    )
    rule = res.scalars().first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found in this brand workspace")

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


@router.post("/{brand_id}/rules", response_model=BrandRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_brand_rule(
    brand_id: uuid.UUID,
    payload: BrandRuleCreateRequest,
    tenant: TenantContext = Depends(require_permission(Permission.RULES_CREATE)),
    db: AsyncSession = Depends(get_db),
):
    """Creates a rule under the authenticated tenant."""
    rule = BrandRule(
        brand_id=tenant.brand_id,
        rule_type=payload.rule_type,
        name=payload.name.strip(),
        pattern_or_instruction=payload.pattern_or_instruction.strip(),
        severity=payload.severity,
        explanation_template=payload.explanation_template.strip(),
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


@router.put("/{brand_id}/rules/{rule_id}", response_model=BrandRuleResponse)
async def update_brand_rule(
    brand_id: uuid.UUID,
    rule_id: uuid.UUID,
    payload: BrandRuleUpdateRequest,
    tenant: TenantContext = Depends(require_permission(Permission.RULES_UPDATE)),
    db: AsyncSession = Depends(get_db),
):
    """Updates a rule. Enforces tenant scope (IDOR prevention)."""
    res = await db.execute(
        select(BrandRule).where(
            BrandRule.id == rule_id,
            BrandRule.brand_id == tenant.brand_id,
        )
    )
    rule = res.scalars().first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found in this brand workspace")

    if payload.name is not None:
        rule.name = payload.name.strip()
    if payload.pattern_or_instruction is not None:
        rule.pattern_or_instruction = payload.pattern_or_instruction.strip()
    if payload.severity is not None:
        rule.severity = payload.severity
    if payload.explanation_template is not None:
        rule.explanation_template = payload.explanation_template.strip()
    if payload.applies_to_channels is not None:
        rule.applies_to_channels = payload.applies_to_channels
    if payload.is_active is not None:
        rule.is_active = payload.is_active

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


@router.delete("/{brand_id}/rules/{rule_id}")
async def delete_brand_rule(
    brand_id: uuid.UUID,
    rule_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.RULES_DELETE)),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a rule. Enforces tenant scope (IDOR prevention)."""
    res = await db.execute(
        select(BrandRule).where(
            BrandRule.id == rule_id,
            BrandRule.brand_id == tenant.brand_id,
        )
    )
    rule = res.scalars().first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found in this brand workspace")

    await db.delete(rule)
    await db.commit()
    return {"message": "Rule deleted successfully"}
