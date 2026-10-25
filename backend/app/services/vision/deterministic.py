import io
import math
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image
import cv2
from pydantic import BaseModel


class ColorAuditFinding(BaseModel):
    extracted_hex: str
    nearest_brand_hex: str
    distance_delta_e: float
    is_compliant: bool
    percentage_coverage: float


class VisualAuditResult(BaseModel):
    overall_visual_score: int
    aspect_ratio: float
    dimensions: Tuple[int, int]
    is_aspect_ratio_compliant: bool
    target_channel_spec: str
    color_findings: List[ColorAuditFinding]
    logo_detected: Optional[bool] = None
    summary: str


class DeterministicVisionChecker:
    """Uses OpenCV and Pillow for mathematical visual verification."""

    @staticmethod
    def rgb_to_hex(r: int, g: int, b: int) -> str:
        return f"#{r:02x}{g:02x}{b:02x}".upper()

    @staticmethod
    def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
        hex_code = hex_code.lstrip("#")
        if len(hex_code) == 3:
            hex_code = "".join([c * 2 for c in hex_code])
        return tuple(int(hex_code[i:i + 2], 16) for i in (0, 2, 4))

    @staticmethod
    def color_distance_cielab(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
        """Computes approximate CIELAB Delta-E color difference using OpenCV."""
        pixel1 = np.uint8([[list(rgb1)]])
        pixel2 = np.uint8([[list(rgb2)]])
        lab1 = cv2.cvtColor(pixel1, cv2.COLOR_RGB2LAB).astype(np.float32)[0][0]
        lab2 = cv2.cvtColor(pixel2, cv2.COLOR_RGB2LAB).astype(np.float32)[0][0]
        return float(np.linalg.norm(lab1 - lab2))

    def extract_dominant_colors(self, image: Image.Image, k: int = 5) -> List[Tuple[str, float]]:
        """Extracts top k dominant hex colors and their coverage percentages using K-Means."""
        # Resize to fast thumbnail for rapid clustering
        img_small = image.copy().convert("RGB")
        img_small.thumbnail((150, 150))
        img_arr = np.array(img_small).reshape(-1, 3).astype(np.float32)

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        flags = cv2.KMEANS_RANDOM_CENTERS
        compactness, labels, centers = cv2.kmeans(img_arr, k, None, criteria, 10, flags)

        counts = np.bincount(labels.flatten())
        total = float(len(labels))
        dominant = []
        for i in range(len(centers)):
            r, g, b = [int(v) for v in centers[i]]
            hex_code = self.rgb_to_hex(r, g, b)
            percentage = round((counts[i] / total) * 100, 2)
            dominant.append((hex_code, percentage))

        dominant.sort(key=lambda x: x[1], reverse=True)
        return dominant

    def check_logo_presence(self, candidate_image: Image.Image, logo_template_image: Image.Image, threshold: float = 0.75) -> bool:
        """Template matching to check if approved brand logo is present."""
        img_cv = cv2.cvtColor(np.array(candidate_image.convert("RGB")), cv2.COLOR_RGB2GRAY)
        tmpl_cv = cv2.cvtColor(np.array(logo_template_image.convert("RGB")), cv2.COLOR_RGB2GRAY)

        # Multi-scale matching
        found = False
        h, w = tmpl_cv.shape[:2]
        for scale in [0.5, 0.75, 1.0, 1.25, 1.5]:
            new_w, new_h = int(w * scale), int(h * scale)
            if new_w >= img_cv.shape[1] or new_h >= img_cv.shape[0] or new_w <= 10 or new_h <= 10:
                continue
            resized_tmpl = cv2.resize(tmpl_cv, (new_w, new_h))
            res = cv2.matchTemplate(img_cv, resized_tmpl, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, _ = cv2.minMaxLoc(res)
            if max_val >= threshold:
                found = True
                break
        return found

    def audit_image(
        self,
        image_bytes: bytes,
        approved_brand_hex_codes: List[str],
        channel: str = "general",
        logo_template_bytes: Optional[bytes] = None,
    ) -> VisualAuditResult:
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        aspect_ratio = round(width / max(1, height), 2)

        # Channel target aspect ratios
        channel_ratios = {
            "linkedin": (1.91, "1.91:1 Landscape (1200x627)"),
            "instagram_square": (1.0, "1:1 Square (1080x1080)"),
            "instagram_portrait": (0.8, "4:5 Portrait (1080x1350)"),
            "twitter": (1.78, "16:9 Landscape (1200x675)"),
            "general": (aspect_ratio, "Any"),
        }
        target_ratio, ratio_desc = channel_ratios.get(channel.lower(), (aspect_ratio, "Custom"))
        is_ratio_compliant = abs(aspect_ratio - target_ratio) < 0.1 if channel.lower() != "general" else True

        # Extract dominant colors
        dominant = self.extract_dominant_colors(image, k=5)
        color_findings = []
        brand_rgbs = [self.hex_to_rgb(h) for h in approved_brand_hex_codes]

        score = 100
        if not is_ratio_compliant:
            score -= 15

        for hex_code, pct in dominant:
            rgb = self.hex_to_rgb(hex_code)
            min_dist = float("inf")
            nearest_hex = approved_brand_hex_codes[0] if approved_brand_hex_codes else "#000000"

            for b_hex, b_rgb in zip(approved_brand_hex_codes, brand_rgbs):
                dist = self.color_distance_cielab(rgb, b_rgb)
                if dist < min_dist:
                    min_dist = dist
                    nearest_hex = b_hex

            # Delta-E < 25 is considered visually acceptable brand harmony/shade
            is_comp = min_dist < 25.0
            if not is_comp and pct > 15.0:  # If off-brand color covers > 15% of image
                score -= int(min(20, pct * 0.5))

            color_findings.append(
                ColorAuditFinding(
                    extracted_hex=hex_code,
                    nearest_brand_hex=nearest_hex,
                    distance_delta_e=round(min_dist, 2),
                    is_compliant=is_comp,
                    percentage_coverage=pct,
                )
            )

        logo_detected = None
        if logo_template_bytes:
            logo_img = Image.open(io.BytesIO(logo_template_bytes))
            logo_detected = self.check_logo_presence(image, logo_img)
            if not logo_detected:
                score -= 20

        score = max(0, min(100, score))
        summary = f"Visual audit completed with compliance score {score}/100. Aspect ratio {aspect_ratio} ({'aligned' if is_ratio_compliant else 'misaligned'})."

        return VisualAuditResult(
            overall_visual_score=score,
            aspect_ratio=aspect_ratio,
            dimensions=(width, height),
            is_aspect_ratio_compliant=is_ratio_compliant,
            target_channel_spec=ratio_desc,
            color_findings=color_findings,
            logo_detected=logo_detected,
            summary=summary,
        )

