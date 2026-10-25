from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import uuid
from pydantic import BaseModel


class VectorSearchResult(BaseModel):
    chunk_text: str
    fact_id: str
    category: str
    title: str
    source_document: str
    score: float


class BaseVectorStore(ABC):
    """Abstract interface for multi-tenant vector retrieval."""

    @abstractmethod
    async def index_chunk(
        self,
        brand_id: uuid.UUID,
        fact_id: uuid.UUID,
        chunk_text: str,
        embedding: List[float],
    ) -> str:
        """Stores a vector embedding with strict brand tenancy."""
        pass

    @abstractmethod
    async def search_similar(
        self,
        brand_id: uuid.UUID,
        query_embedding: List[float],
        top_k: int = 5,
        threshold: float = 0.65,
    ) -> List[VectorSearchResult]:
        """Searches vector embeddings strictly scoped to brand_id."""
        pass

    @abstractmethod
    async def delete_by_brand(self, brand_id: uuid.UUID) -> int:
        """Purges all vector embeddings for a given brand."""
        pass
