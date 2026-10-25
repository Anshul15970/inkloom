from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ComplianceFindingDTO(BaseModel):
    finding_type: str  # FACTUAL_INACCURACY, PROHIBITED_TERM, MISSING_DISCLOSURE, TONE_DEVIATION
    severity: str  # CRITICAL, WARNING, SUGGESTION
    original_snippet: str
    explanation: str
    citation_reference: str
    suggested_fix: str


class ComplianceAnalysisResult(BaseModel):
    overall_score: int
    summary: str
    findings: List[ComplianceFindingDTO]


class ImageVibeResult(BaseModel):
    vibe_score: int
    aesthetic_critique: str
    matches_brand_style: bool
    suggestions: List[str]


class BaseLLMProvider(ABC):
    """Abstract base provider for LLM operations. Decouples governance logic from concrete LLM vendor."""

    @abstractmethod
    async def analyze_text_compliance(
        self,
        draft_text: str,
        brand_name: str,
        brand_tone_guidelines: List[str],
        retrieved_golden_facts: List[Dict[str, Any]],
        rules: List[Dict[str, Any]],
        channel: str = "general",
    ) -> ComplianceAnalysisResult:
        """Run text compliance check against retrieved facts, tone, and guardrails."""
        pass

    @abstractmethod
    async def analyze_image_vibe(
        self,
        image_bytes: bytes,
        mime_type: str,
        brand_name: str,
        aesthetic_guidelines: str,
        reference_descriptions: List[str],
    ) -> ImageVibeResult:
        """Evaluate subjective image style and vibe using multimodal reasoning."""
        pass

    @abstractmethod
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for text chunks."""
        pass
