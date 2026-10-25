import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.brand import Brand
    from app.models.user import User
    from app.models.review import ReviewItem


class AuditStatus:
    PASSED = "PASSED"
    WARNINGS_RESOLVABLE = "WARNINGS_RESOLVABLE"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    REJECTED = "REJECTED"


class AuditRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audit_records"

    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    channel: Mapped[str] = mapped_column(String(50), default="general", nullable=False)
    content_type: Mapped[str] = mapped_column(String(20), default="TEXT", nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=AuditStatus.PASSED, nullable=False)
    input_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    metadata_json = mapped_column(JSONB, default=dict, nullable=False)

    brand: Mapped["Brand"] = relationship("Brand", back_populates="audits")
    findings: Mapped[List["AuditFinding"]] = relationship("AuditFinding", back_populates="audit", cascade="all, delete-orphan")
    review_item: Mapped["ReviewItem"] = relationship("ReviewItem", back_populates="audit", uselist=False, cascade="all, delete-orphan")


class AuditFinding(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audit_findings"

    audit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("audit_records.id", ondelete="CASCADE"), nullable=False, index=True)
    finding_type: Mapped[str] = mapped_column(String(50), nullable=False)  # FACTUAL_INACCURACY, PROHIBITED_TERM, TONE_DEVIATION, COLOR_MISMATCH, LOGO_ERROR
    severity: Mapped[str] = mapped_column(String(20), default="WARNING", nullable=False)
    original_snippet: Mapped[str] = mapped_column(Text, default="", nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    citation_reference: Mapped[str] = mapped_column(Text, default="", nullable=False)
    suggested_fix: Mapped[str] = mapped_column(Text, default="", nullable=False)
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    audit: Mapped["AuditRecord"] = relationship("AuditRecord", back_populates="findings")

