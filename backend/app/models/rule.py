import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.brand import Brand


class RuleType:
    PROHIBITED_CLAIM = "PROHIBITED_CLAIM"
    MANDATORY_DISCLOSURE = "MANDATORY_DISCLOSURE"
    TONE_OF_VOICE = "TONE_OF_VOICE"
    TERMINOLOGY = "TERMINOLOGY"
    VISUAL_IDENTITY = "VISUAL_IDENTITY"


class RuleSeverity:
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    SUGGESTION = "SUGGESTION"


class BrandRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "brand_rules"

    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    pattern_or_instruction: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default=RuleSeverity.WARNING, nullable=False)
    explanation_template: Mapped[str] = mapped_column(Text, nullable=False)
    applies_to_channels = mapped_column(JSONB, default=lambda: ["all"], nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    brand: Mapped["Brand"] = relationship("Brand", back_populates="rules")


class VisualAsset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "visual_assets"

    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)  # LOGO, COLOR_PALETTE, GOLDEN_REFERENCE
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    metadata_json = mapped_column(JSONB, default=dict, nullable=False)  # hex colors, margins, aspect ratios
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

