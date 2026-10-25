import asyncio
import pytest
from app.services.ai.gemini import GeminiProvider


def test_offline_heuristic_compliance_audit():
    async def _run():
        provider = GeminiProvider(api_key=None)

        draft_text = "Get 50% discount and guaranteed 100% uptime with the cheapest cloud platform."
        rules = [
            {
                "name": "Superlative Claim Policy",
                "rule_type": "PROHIBITED_CLAIM",
                "pattern_or_instruction": "cheapest",
                "severity": "CRITICAL",
                "explanation_template": "Comparative superlatives are prohibited without verification.",
            },
            {
                "name": "Statutory Disclaimer",
                "rule_type": "MANDATORY_DISCLOSURE",
                "pattern_or_instruction": "Terms and conditions apply.",
                "severity": "WARNING",
                "explanation_template": "Promotional offers require T&C disclosure.",
            },
        ]

        result = await provider.analyze_text_compliance(
            draft_text=draft_text,
            brand_name="Acme Cloud",
            brand_tone_guidelines=["Professional"],
            retrieved_golden_facts=[],
            rules=rules,
            channel="linkedin",
        )

        assert result.overall_score < 100
        assert len(result.findings) == 2
        types = [f.finding_type for f in result.findings]
        assert "PROHIBITED_TERM" in types
        assert "MISSING_DISCLOSURE" in types

    asyncio.run(_run())


def test_mock_embedding_generation():
    async def _run():
        provider = GeminiProvider(api_key=None)
        embeddings = await provider.generate_embeddings(["Acme Cloud SLA is 99.99%"])
        assert len(embeddings) == 1
        assert len(embeddings[0]) == 768

    asyncio.run(_run())
