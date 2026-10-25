import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.fact import GoldenFact
from app.models.rule import BrandRule
from app.models.audit import AuditRecord, AuditFinding, AuditStatus
from app.models.review import ReviewItem, ReviewStatus
from app.core.permissions import Permission
from app.api.deps import require_permission, TenantContext
from app.services.ai.gemini import GeminiProvider
from app.services.vision.deterministic import DeterministicVisionChecker

router = APIRouter()
ai_provider = GeminiProvider()
vision_checker = DeterministicVisionChecker()


class TextAuditRequest(BaseModel):
    draft_text: str
    channel: str = "general"


class FindingDTO(BaseModel):
    id: Optional[str] = None
    finding_type: str
    severity: str
    original_snippet: str
    explanation: str
    citation_reference: str
    suggested_fix: str


class AuditResponse(BaseModel):
    audit_id: str
    brand_id: str
    overall_score: int
    status: str
    summary: str
    findings: List[FindingDTO]


class EscalateAuditRequest(BaseModel):
    creator_notes: str


class EscalateResponse(BaseModel):
    review_id: str
    audit_id: str
    status: str
    message: str


@router.post("/{brand_id}/audit/text", response_model=AuditResponse)
async def audit_text(
    brand_id: uuid.UUID,
    payload: TextAuditRequest,
    tenant: TenantContext = Depends(require_permission(Permission.AUDIT_CREATE)),
    db: AsyncSession = Depends(get_db),
):
    """Executes a text compliance evaluation. Strictly scoped to tenant's golden facts and rules."""
    # 1. Fetch active golden facts for this brand only
    facts_res = await db.execute(
        select(GoldenFact).where(GoldenFact.brand_id == tenant.brand_id, GoldenFact.is_active.is_(True))
    )
    facts = facts_res.scalars().all()
    facts_data = [
        {
            "id": str(f.id),
            "category": f.category,
            "title": f.title,
            "claim_statement": f.claim_statement,
            "source_document": f.source_document,
        }
        for f in facts
    ]

    # 2. Fetch active rules for this brand only
    rules_res = await db.execute(
        select(BrandRule).where(BrandRule.brand_id == tenant.brand_id, BrandRule.is_active.is_(True))
    )
    rules = rules_res.scalars().all()
    rules_data = [
        {
            "id": str(r.id),
            "name": r.name,
            "rule_type": r.rule_type,
            "pattern_or_instruction": r.pattern_or_instruction,
            "severity": r.severity,
            "explanation_template": r.explanation_template,
        }
        for r in rules
    ]

    # 3. Call AI Governance Engine
    result = await ai_provider.analyze_text_compliance(
        draft_text=payload.draft_text,
        brand_name=tenant.brand.name,
        brand_tone_guidelines=["Professional", "Accurate", "Empathetic"],
        retrieved_golden_facts=facts_data,
        rules=rules_data,
        channel=payload.channel,
    )

    # 4. Determine status
    audit_status = AuditStatus.PASSED
    if result.overall_score < 70 or any(f.severity == "CRITICAL" for f in result.findings):
        audit_status = AuditStatus.NEEDS_REVIEW
    elif result.findings:
        audit_status = AuditStatus.WARNINGS_RESOLVABLE

    # 5. Save audit record under tenant
    record = AuditRecord(
        brand_id=tenant.brand_id,
        user_id=tenant.user.id,
        channel=payload.channel,
        content_type="TEXT",
        overall_score=result.overall_score,
        status=audit_status,
        input_text=payload.draft_text,
    )
    db.add(record)
    await db.flush()

    finding_dtos = []
    for f in result.findings:
        finding = AuditFinding(
            audit_id=record.id,
            finding_type=f.finding_type,
            severity=f.severity,
            original_snippet=f.original_snippet,
            explanation=f.explanation,
            citation_reference=f.citation_reference,
            suggested_fix=f.suggested_fix,
        )
        db.add(finding)
        await db.flush()
        finding_dtos.append(
            FindingDTO(
                id=str(finding.id),
                finding_type=f.finding_type,
                severity=f.severity,
                original_snippet=f.original_snippet,
                explanation=f.explanation,
                citation_reference=f.citation_reference,
                suggested_fix=f.suggested_fix,
            )
        )

    await db.commit()

    return AuditResponse(
        audit_id=str(record.id),
        brand_id=str(record.brand_id),
        overall_score=result.overall_score,
        status=audit_status,
        summary=result.summary,
        findings=finding_dtos,
    )


@router.get("/{brand_id}/audit/{audit_id}", response_model=AuditResponse)
async def get_audit(
    brand_id: uuid.UUID,
    audit_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.AUDIT_READ)),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves an audit report. Prevents IDOR by querying strictly by brand_id."""
    res = await db.execute(
        select(AuditRecord).where(
            AuditRecord.id == audit_id,
            AuditRecord.brand_id == tenant.brand_id,
        )
    )
    audit = res.scalars().first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit record not found in this brand")

    findings_res = await db.execute(
        select(AuditFinding).where(AuditFinding.audit_id == audit.id)
    )
    findings = findings_res.scalars().all()

    return AuditResponse(
        audit_id=str(audit.id),
        brand_id=str(audit.brand_id),
        overall_score=audit.overall_score,
        status=audit.status,
        summary=f"Audit completed with score {audit.overall_score}/100.",
        findings=[
            FindingDTO(
                id=str(f.id),
                finding_type=f.finding_type,
                severity=f.severity,
                original_snippet=f.original_snippet,
                explanation=f.explanation,
                citation_reference=f.citation_reference,
                suggested_fix=f.suggested_fix,
            )
            for f in findings
        ],
    )


@router.post("/{brand_id}/audit/{audit_id}/escalate", response_model=EscalateResponse)
async def escalate_audit(
    brand_id: uuid.UUID,
    audit_id: uuid.UUID,
    payload: EscalateAuditRequest,
    tenant: TenantContext = Depends(require_permission(Permission.AUDIT_CREATE)),
    db: AsyncSession = Depends(get_db),
):
    """Escalates a flagged audit to the brand review queue. Enforces tenant scope."""
    res = await db.execute(
        select(AuditRecord).where(
            AuditRecord.id == audit_id,
            AuditRecord.brand_id == tenant.brand_id,
        )
    )
    audit = res.scalars().first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit record not found in this brand")

    review_item = ReviewItem(
        brand_id=tenant.brand_id,
        audit_id=audit.id,
        submitted_by_id=tenant.user.id,
        status=ReviewStatus.PENDING,
        creator_notes=payload.creator_notes.strip(),
    )
    audit.status = AuditStatus.NEEDS_REVIEW
    db.add(review_item)
    await db.commit()
    await db.refresh(review_item)

    return EscalateResponse(
        review_id=str(review_item.id),
        audit_id=str(audit.id),
        status=review_item.status,
        message="Draft successfully escalated to brand review queue.",
    )
