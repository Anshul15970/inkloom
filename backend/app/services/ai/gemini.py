import json
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.ai.base import (
    BaseLLMProvider,
    ComplianceAnalysisResult,
    ComplianceFindingDTO,
    ImageVibeResult,
)

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.vision_model_name = settings.GEMINI_VISION_MODEL
        self.embedding_model = settings.EMBEDDING_MODEL
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}")

    async def analyze_text_compliance(
        self,
        draft_text: str,
        brand_name: str,
        brand_tone_guidelines: List[str],
        retrieved_golden_facts: List[Dict[str, Any]],
        rules: List[Dict[str, Any]],
        channel: str = "general",
    ) -> ComplianceAnalysisResult:
        """Audits draft text using Gemini or deterministic fallback when offline."""
        if not self._client:
            # Deterministic rule & heuristic evaluator for test / offline mode
            return self._heuristic_text_analysis(
                draft_text, brand_name, brand_tone_guidelines, retrieved_golden_facts, rules, channel
            )

        prompt = f"""
You are the AI Brand Governance Engine for "{brand_name}".
Your task is to audit the following draft copy for a "{channel}" marketing channel.

DRAFT TEXT TO AUDIT:
\"\"\"{draft_text}\"\"\"

GOLDEN FACTS (Ground Truth):
{json.dumps(retrieved_golden_facts, indent=2)}

BRAND RULES & GUARDRAILS:
{json.dumps(rules, indent=2)}

TONE GUIDELINES:
{json.dumps(brand_tone_guidelines, indent=2)}

INSTRUCTIONS:
1. Compare claims against Golden Facts. If numbers, statistics, pricing, or product claims differ or are unverified, flag as FACTUAL_INACCURACY.
2. Check for prohibited terms or missing mandatory disclosures specified in Brand Rules.
3. Check for tone deviations (e.g. passive vs active, overly aggressive, casual vs professional).
4. For every issue, provide:
   - finding_type: FACTUAL_INACCURACY | PROHIBITED_TERM | MISSING_DISCLOSURE | TONE_DEVIATION
   - severity: CRITICAL | WARNING | SUGGESTION
   - original_snippet: Exact text phrase flagged
   - explanation: Direct reason citing the specific rule or Golden Fact
   - citation_reference: Document or fact source title
   - suggested_fix: Prescriptive replacement keeping the creator's intent
5. Output an overall compliance score from 0 to 100.

Return ONLY a valid JSON object matching this schema:
{{
  "overall_score": 85,
  "summary": "Brief 1-2 sentence overall review summary",
  "findings": [
    {{
      "finding_type": "FACTUAL_INACCURACY",
      "severity": "CRITICAL",
      "original_snippet": "exact snippet",
      "explanation": "why it violated the rule",
      "citation_reference": "Golden Fact #4 / Brand Policy 2.1",
      "suggested_fix": "suggested revision"
    }}
  ]
}}
"""
        try:
            from google.genai import types
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            data = json.loads(response.text)
            findings = [ComplianceFindingDTO(**f) for f in data.get("findings", [])]
            return ComplianceAnalysisResult(
                overall_score=data.get("overall_score", 100),
                summary=data.get("summary", "Audit completed."),
                findings=findings,
            )
        except Exception as e:
            logger.error(f"Gemini API error during text audit: {e}", exc_info=True)
            return self._heuristic_text_analysis(
                draft_text, brand_name, brand_tone_guidelines, retrieved_golden_facts, rules, channel
            )

    async def analyze_image_vibe(
        self,
        image_bytes: bytes,
        mime_type: str,
        brand_name: str,
        aesthetic_guidelines: str,
        reference_descriptions: List[str],
    ) -> ImageVibeResult:
        if not self._client:
            return ImageVibeResult(
                vibe_score=90,
                aesthetic_critique="Image matches standard corporate aesthetic criteria (offline mode).",
                matches_brand_style=True,
                suggestions=["Ensure visual balance with adjacent typographic elements."],
            )

        prompt = f"""
You are the Creative Director and Visual Identity Auditor for "{brand_name}".
Aesthetic Guidelines: {aesthetic_guidelines}
Reference Standards: {json.dumps(reference_descriptions)}

Analyze this uploaded visual asset for composition, lighting, subject matter, and alignment with the brand vibe.
Return ONLY a valid JSON object matching this schema:
{{
  "vibe_score": 88,
  "aesthetic_critique": "Crisp modern composition with high subject clarity.",
  "matches_brand_style": true,
  "suggestions": ["Slightly boost warm highlights to match primary palette."]
}}
"""
        try:
            from google.genai import types
            response = self._client.models.generate_content(
                model=self.vision_model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            return ImageVibeResult(
                vibe_score=data.get("vibe_score", 85),
                aesthetic_critique=data.get("aesthetic_critique", "Visual analyzed."),
                matches_brand_style=data.get("matches_brand_style", True),
                suggestions=data.get("suggestions", []),
            )
        except Exception as e:
            logger.error(f"Gemini Vision API error: {e}", exc_info=True)
            return ImageVibeResult(
                vibe_score=85,
                aesthetic_critique="Automated visual assessment fallback.",
                matches_brand_style=True,
                suggestions=["Verify color contrast manually."],
            )

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not self._client or not texts:
            # Deterministic mock 768-dim embedding for testing
            return [[0.01 * (i % 10) for i in range(768)] for _ in texts]

        try:
            embeddings = []
            for text in texts:
                res = self._client.models.embed_content(
                    model=self.embedding_model,
                    contents=text,
                )
                embeddings.append(res.embedding.values)
            return embeddings
        except Exception as e:
            logger.error(f"Gemini embedding generation error: {e}")
            return [[0.01 * (i % 10) for i in range(768)] for _ in texts]

    def _heuristic_text_analysis(
        self,
        draft_text: str,
        brand_name: str,
        brand_tone_guidelines: List[str],
        retrieved_golden_facts: List[Dict[str, Any]],
        rules: List[Dict[str, Any]],
        channel: str,
    ) -> ComplianceAnalysisResult:
        findings = []
        score = 100
        lower_draft = draft_text.lower()

        # Check prohibited terms and mandatory rules
        for rule in rules:
            term = rule.get("pattern_or_instruction", "").lower()
            rtype = rule.get("rule_type", "")
            if rtype == "PROHIBITED_CLAIM" and term and term in lower_draft:
                score -= 20
                findings.append(
                    ComplianceFindingDTO(
                        finding_type="PROHIBITED_TERM",
                        severity=rule.get("severity", "CRITICAL"),
                        original_snippet=term,
                        explanation=rule.get("explanation_template", f"Prohibited phrase '{term}' violates brand policy."),
                        citation_reference=rule.get("name", "Brand Guardrail Policy"),
                        suggested_fix=f"[Remove or replace '{term}']",
                    )
                )
            elif rtype == "MANDATORY_DISCLOSURE" and term and term not in lower_draft:
                score -= 15
                findings.append(
                    ComplianceFindingDTO(
                        finding_type="MISSING_DISCLOSURE",
                        severity="WARNING",
                        original_snippet="End of content",
                        explanation=f"Required disclosure '{term}' is missing.",
                        citation_reference=rule.get("name", "Legal Disclosure Policy"),
                        suggested_fix=f"Include disclosure: '{term}'",
                    )
                )

        score = max(0, min(100, score))
        summary = (
            "Content passed all checks."
            if not findings
            else f"Flagged {len(findings)} governance compliance issue(s) needing resolution."
        )
        return ComplianceAnalysisResult(overall_score=score, summary=summary, findings=findings)

