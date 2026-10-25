import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.review import ReviewItem, ReviewStatus
from app.models.audit import AuditRecord, AuditStatus
from app.core.permissions import Permission
from app.api.deps import require_permission, TenantContext

router = APIRouter()


class ReviewActionRequest(BaseModel):
    action: str  # "APPROVE", "REJECT", "REQUEST_CHANGES"
    comments: str


class ReviewItemResponse(BaseModel):
    id: str
    brand_id: str
    audit_id: str
    status: str
    creator_notes: str
    reviewer_comments: str
    content_snippet: str
    overall_score: int
    created_at: str


@router.get("/{brand_id}/reviews", response_model=List[ReviewItemResponse])
async def list_review_queue(
    brand_id: uuid.UUID,
    status_filter: Optional[str] = None,
    tenant: TenantContext = Depends(require_permission(Permission.REVIEW_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """Lists escalated drafts strictly for the authorized tenant."""
    query = (
        select(ReviewItem, AuditRecord)
        .join(AuditRecord, AuditRecord.id == ReviewItem.audit_id)
        .where(ReviewItem.brand_id == tenant.brand_id)
    )
    if status_filter:
        query = query.where(ReviewItem.status == status_filter)

    res = await db.execute(query.order_by(ReviewItem.created_at.desc()))
    return [
        ReviewItemResponse(
            id=str(rev.id),
            brand_id=str(rev.brand_id),
            audit_id=str(audit.id),
            status=rev.status,
            creator_notes=rev.creator_notes,
            reviewer_comments=rev.reviewer_comments,
            content_snippet=audit.input_text[:120] + ("..." if len(audit.input_text) > 120 else ""),
            overall_score=audit.overall_score,
            created_at=rev.created_at.isoformat() if rev.created_at else "",
        )
        for rev, audit in res.all()
    ]


@router.get("/{brand_id}/reviews/{review_id}", response_model=ReviewItemResponse)
async def get_review_item(
    brand_id: uuid.UUID,
    review_id: uuid.UUID,
    tenant: TenantContext = Depends(require_permission(Permission.REVIEW_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a single review item. Enforces tenant scope (IDOR prevention)."""
    res = await db.execute(
        select(ReviewItem, AuditRecord)
        .join(AuditRecord, AuditRecord.id == ReviewItem.audit_id)
        .where(
            ReviewItem.id == review_id,
            ReviewItem.brand_id == tenant.brand_id,
        )
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review item not found in this brand workspace")

    rev, audit = row
    return ReviewItemResponse(
        id=str(rev.id),
        brand_id=str(rev.brand_id),
        audit_id=str(audit.id),
        status=rev.status,
        creator_notes=rev.creator_notes,
        reviewer_comments=rev.reviewer_comments,
        content_snippet=audit.input_text[:120],
        overall_score=audit.overall_score,
        created_at=rev.created_at.isoformat() if rev.created_at else "",
    )


@router.post("/{brand_id}/reviews/{review_id}/action", response_model=ReviewItemResponse)
async def take_review_action(
    brand_id: uuid.UUID,
    review_id: uuid.UUID,
    payload: ReviewActionRequest,
    tenant: TenantContext = Depends(require_permission(Permission.REVIEW_ACT)),
    db: AsyncSession = Depends(get_db),
):
    """Takes decision on an escalated draft (Approve, Reject, Request Changes). Enforces tenant scope."""
    res = await db.execute(
        select(ReviewItem, AuditRecord)
        .join(AuditRecord, AuditRecord.id == ReviewItem.audit_id)
        .where(
            ReviewItem.id == review_id,
            ReviewItem.brand_id == tenant.brand_id,
        )
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review item not found in this brand workspace")

    rev, audit = row
    action = payload.action.upper()
    if action == "APPROVE":
        rev.status = ReviewStatus.APPROVED
        audit.status = AuditStatus.PASSED
    elif action == "REJECT":
        rev.status = ReviewStatus.REJECTED
        audit.status = AuditStatus.REJECTED
    elif action == "REQUEST_CHANGES":
        rev.status = ReviewStatus.CHANGES_REQUESTED
        audit.status = AuditStatus.WARNINGS_RESOLVABLE
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid action '{payload.action}'")

    rev.reviewer_comments = payload.comments.strip()
    rev.reviewed_by_id = tenant.user.id
    rev.reviewed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(rev)

    return ReviewItemResponse(
        id=str(rev.id),
        brand_id=str(rev.brand_id),
        audit_id=str(audit.id),
        status=rev.status,
        creator_notes=rev.creator_notes,
        reviewer_comments=rev.reviewer_comments,
        content_snippet=audit.input_text[:120],
        overall_score=audit.overall_score,
        created_at=rev.created_at.isoformat() if rev.created_at else "",
    )
