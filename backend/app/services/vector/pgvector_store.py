import uuid
from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.fact import GoldenFact, GoldenFactEmbedding
from app.services.vector.base import BaseVectorStore, VectorSearchResult


class PgVectorStore(BaseVectorStore):
    """PostgreSQL + pgvector multi-tenant store implementation."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def index_chunk(
        self,
        brand_id: uuid.UUID,
        fact_id: uuid.UUID,
        chunk_text: str,
        embedding: List[float],
    ) -> str:
        record = GoldenFactEmbedding(
            brand_id=brand_id,
            fact_id=fact_id,
            chunk_text=chunk_text,
            embedding=embedding,
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return str(record.id)

    async def search_similar(
        self,
        brand_id: uuid.UUID,
        query_embedding: List[float],
        top_k: int = 5,
        threshold: float = 0.65,
    ) -> List[VectorSearchResult]:
        # Using cosine distance operator <=> in pgvector
        stmt = (
            select(
                GoldenFactEmbedding.chunk_text,
                GoldenFactEmbedding.fact_id,
                GoldenFact.category,
                GoldenFact.title,
                GoldenFact.source_document,
                (1 - (GoldenFactEmbedding.embedding.cosine_distance(query_embedding))).label("similarity"),
            )
            .join(GoldenFact, GoldenFact.id == GoldenFactEmbedding.fact_id)
            .where(
                GoldenFactEmbedding.brand_id == brand_id,
                GoldenFact.is_active.is_(True),
            )
            .order_by(GoldenFactEmbedding.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )

        try:
            results = await self.session.execute(stmt)
            rows = results.all()
            output = []
            for row in rows:
                sim = float(row.similarity) if row.similarity is not None else 1.0
                output.append(
                    VectorSearchResult(
                        chunk_text=row.chunk_text,
                        fact_id=str(row.fact_id),
                        category=row.category,
                        title=row.title,
                        source_document=row.source_document,
                        score=round(sim, 4),
                    )
                )
            return output
        except Exception:
            # Fallback for environments without pgvector compiled
            raw_facts = await self.session.execute(
                select(GoldenFact).where(GoldenFact.brand_id == brand_id, GoldenFact.is_active.is_(True)).limit(top_k)
            )
            facts = raw_facts.scalars().all()
            return [
                VectorSearchResult(
                    chunk_text=f.claim_statement,
                    fact_id=str(f.id),
                    category=f.category,
                    title=f.title,
                    source_document=f.source_document,
                    score=1.0,
                )
                for f in facts
            ]

    async def delete_by_brand(self, brand_id: uuid.UUID) -> int:
        stmt = delete(GoldenFactEmbedding).where(GoldenFactEmbedding.brand_id == brand_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount

