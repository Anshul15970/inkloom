import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    from sqlalchemy import ARRAY, Float
    Vector = lambda dim: ARRAY(Float)

if TYPE_CHECKING:
    from app.models.brand import Brand


class GoldenFact(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "golden_facts"

    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), default="general", nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    claim_statement: Mapped[str] = mapped_column(Text, nullable=False)
    source_document: Mapped[str] = mapped_column(String(255), default="Brand Guidelines", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    brand: Mapped["Brand"] = relationship("Brand", back_populates="golden_facts")
    embeddings: Mapped[List["GoldenFactEmbedding"]] = relationship("GoldenFactEmbedding", back_populates="fact", cascade="all, delete-orphan")


class GoldenFactEmbedding(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "golden_fact_embeddings"

    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    fact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("golden_facts.id", ondelete="CASCADE"), nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(Vector(768), nullable=False)

    fact: Mapped["GoldenFact"] = relationship("GoldenFact", back_populates="embeddings")

    __table_args__ = (
        Index("ix_fact_embedding_brand_id", "brand_id"),
    )
