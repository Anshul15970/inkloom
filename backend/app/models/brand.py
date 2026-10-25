import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.fact import GoldenFact
    from app.models.rule import BrandRule, VisualAsset
    from app.models.audit import AuditRecord
    from app.models.invitation import BrandInvitation


class BrandRole:
    OWNER = "OWNER"
    BRAND_MANAGER = "BRAND_MANAGER"
    COMPLIANCE_REVIEWER = "COMPLIANCE_REVIEWER"
    CONTENT_CREATOR = "CONTENT_CREATOR"


class Brand(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "brands"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(1024), default="", nullable=False)
    website: Mapped[str] = mapped_column(String(255), default="", nullable=False)

    memberships: Mapped[List["BrandMembership"]] = relationship(
        "BrandMembership",
        back_populates="brand",
        cascade="all, delete-orphan",
    )
    invitations: Mapped[List["BrandInvitation"]] = relationship(
        "BrandInvitation",
        back_populates="brand",
        cascade="all, delete-orphan",
    )
    golden_facts: Mapped[List["GoldenFact"]] = relationship(
        "GoldenFact",
        back_populates="brand",
        cascade="all, delete-orphan",
    )
    rules: Mapped[List["BrandRule"]] = relationship(
        "BrandRule",
        back_populates="brand",
        cascade="all, delete-orphan",
    )
    visual_assets: Mapped[List["VisualAsset"]] = relationship(
        "VisualAsset",
        back_populates="brand",
        cascade="all, delete-orphan",
    )
    audits: Mapped[List["AuditRecord"]] = relationship(
        "AuditRecord",
        back_populates="brand",
        cascade="all, delete-orphan",
    )


class BrandMembership(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "brand_memberships"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(50), default=BrandRole.CONTENT_CREATOR, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="memberships")
    brand: Mapped["Brand"] = relationship("Brand", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("user_id", "brand_id", name="uq_user_brand_membership"),
    )
