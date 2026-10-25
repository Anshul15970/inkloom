import io
from PIL import Image
import pytest
from app.services.vision.deterministic import DeterministicVisionChecker


def test_rgb_hex_conversion():
    checker = DeterministicVisionChecker()
    assert checker.rgb_to_hex(255, 0, 0) == "#FF0000"
    assert checker.rgb_to_hex(15, 23, 42) == "#0F172A"
    assert checker.hex_to_rgb("#FF0000") == (255, 0, 0)
    assert checker.hex_to_rgb("#0F172A") == (15, 23, 42)


def test_cielab_color_distance():
    checker = DeterministicVisionChecker()
    # Same color distance should be 0
    dist_same = checker.color_distance_cielab((255, 0, 0), (255, 0, 0))
    assert dist_same == 0.0

    # Distance between black and white should be high
    dist_diff = checker.color_distance_cielab((0, 0, 0), (255, 255, 255))
    assert dist_diff > 50.0


def test_audit_image_colors_and_ratio():
    checker = DeterministicVisionChecker()
    # Create a simple 1200x627 test image (LinkedIn ratio)
    img = Image.new("RGB", (1200, 627), color=(15, 23, 42))  # #0F172A
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    image_bytes = buf.getvalue()

    result = checker.audit_image(
        image_bytes=image_bytes,
        approved_brand_hex_codes=["#0F172A", "#3B82F6"],
        channel="linkedin",
    )

    assert result.is_aspect_ratio_compliant is True
    assert result.aspect_ratio == 1.91
    assert result.overall_visual_score >= 80
    assert len(result.color_findings) > 0
    assert result.color_findings[0].is_compliant is True

