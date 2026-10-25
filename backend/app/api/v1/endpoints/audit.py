import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.fact import GoldenFact
from app.models.rule import BrandRule, VisualAsset
from app.models.audit import AuditRecord, AuditFinding, AuditStatus
from app.models.review import ReviewItem, ReviewStatus
from app.api.deps import get_tenant_context, TenantContext
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
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch active golden facts for this brand
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

    # 2. Fetch active rules for this brand
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

    # 4. Determine overall audit status
    audit_status = AuditStatus.PASSED
    if result.overall_score < 70 or any(f.severity == "CRITICAL" for f in result.findings):
        audit_status = AuditStatus.NEEDS_REVIEW
    elif result.findings:
        audit_status = AuditStatus.WARNINGS_RESOLVABLE

    # 5. Persist audit record and findings
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
        overall_score=result.overall_score,
        status=audit_status,
        summary=result.summary,
        findings=finding_dtos,
    )


@router.post("/{brand_id}/audit/image", response_model=AuditResponse)
async def audit_image(
    brand_id: uuid.UUID,
    file: UploadFile = File(...),
    channel: str = Form("general"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    image_bytes = await file.read()
    
    # Retrieve brand visual assets (e.g. hex colors)
    # Default brand colors if none stored
    approved_hexes = ["#0F172A", "#3B82F6", "#10B981", "#FFFFFF"]

    # 1. Deterministic OpenCV audit
    cv_res = vision_checker.audit_image(
        image_bytes=image_bytes,
        approved_brand_hex_codes=approved_hexes,
        channel=channel,
    )

    # 2. Qualitative Gemini Vibe audit
    vibe_res = await ai_provider.analyze_image_vibe(
        image_bytes=image_bytes,
        mime_type=file.content_type or "image/png",
        brand_name=tenant.brand.name,
        aesthetic_guidelines="Clean, corporate, professional typography and balanced lighting.",
        reference_descriptions=["Corporate brand photography, minimalist aesthetic"],
    )

    combined_score = int((cv_res.overall_visual_score * 0.6) + (vibe_res.vibe_score * 0.4))
    audit_status = AuditStatus.PASSED if combined_score >= 80 else AuditStatus.WARNINGS_RESOLVABLE

    record = AuditRecord(
        brand_id=tenant.brand_id,
        user_id=tenant.user.id,
        channel=channel,
        content_type="IMAGE",
        overall_score=combined_score,
        status=audit_status,
        input_text=f"Uploaded image: {file.filename} ({cv_res.dimensions[0]}x{cv_res.dimensions[1]})",
    )
    db.add(record)
    await db.flush()

    finding_dtos = []
    # Add findings for off-brand colors or aspect ratio
    if not cv_res.is_aspect_ratio_compliant:
        f = AuditFinding(
            audit_id=record.id,
            finding_type="ASPECT_RATIO_MISMATCH",
            severity="WARNING",
            original_snippet=f"Detected aspect ratio {cv_res.aspect_ratio}",
            explanation=f"Channel {channel} requires aspect ratio {cv_res.target_channel_spec}",
            citation_reference="Social Media Visual Specifications",
            suggested_fix=f"Crop image to {cv_res.target_channel_spec}",
        )
        db.add(f)
        await db.flush()
        finding_dtos.append(
            FindingDTO(
                id=str(f.id),
                finding_type=f.finding_type,
                severity=f.severity,
                original_snippet=f.original_snippet,
                explanation=f.explanation,
                citation_reference=f.citation_reference,
                suggested_fix=f.suggested_fix,
            )
        )

    for c in cv_res.color_findings:
        if not c.is_compliant:
            f = AuditFinding(
                audit_id=record.id,
                finding_type="COLOR_MISMATCH",
                severity="WARNING",
                original_snippet=f"Dominant hex {c.extracted_hex} ({c.percentage_coverage}% coverage)",
                explanation=f"Color is not within permitted brand palette (nearest brand swatch: {c.nearest_brand_hex}, Delta-E: {c.distance_delta_e})",
                citation_reference="Brand Color Palette Guidelines",
                suggested_fix=f"Adjust tint or color overlay towards approved brand hex {c.nearest_brand_hex}",
            )
            db.add(f)
            await db.flush()
            finding_dtos.append(
                FindingDTO(
                    id=str(f.id),
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
        overall_score=combined_score,
        status=audit_status,
        summary=f"{cv_res.summary} Aesthetic critique: {vibe_res.aesthetic_critique}",
        findings=finding_dtos,
    )


@router.post("/{brand_id}/audit/{audit_id}/escalate", response_model=EscalateResponse)
async def escalate_audit(
    brand_id: uuid.UUID,
    audit_id: uuid.UUID,
    payload: EscalateAuditRequest,
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(AuditRecord).where(AuditRecord.id == audit_id, AuditRecord.brand_id == tenant.brand_id)
    )
    audit = res.scalars().first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit record not found")

    review_item = ReviewItem(
        brand_id=tenant.brand_id,
        audit_id=audit.id,
        submitted_by_id=tenant.user.id,
        status=ReviewStatus.PENDING,
        creator_notes=payload.creator_notes,
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

