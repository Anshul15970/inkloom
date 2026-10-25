import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.audit import AuditRecord
    from app.models.user import User


class ReviewStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"


class ReviewItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "review_items"

    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    audit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("audit_records.id", ondelete="CASCADE"), nullable=False)
    submitted_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewed_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default=ReviewStatus.PENDING, nullable=False)
    creator_notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    reviewer_comments: Mapped[str] = mapped_column(Text, default="", nullable=False)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    audit: Mapped["AuditRecord"] = relationship("AuditRecord", back_populates="review_item")
    submitted_by: Mapped["User"] = relationship("User", foreign_keys=[submitted_by_id])
    reviewed_by: Mapped["User"] = relationship("User", foreign_keys=[reviewed_by_id])
