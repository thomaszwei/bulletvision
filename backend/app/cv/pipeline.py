"""
BulletVision CV pipeline — bullet hole detection by frame differencing.

All functions are pure: they take numpy arrays and return results.
No database access, no file I/O. Keep it that way.

Detection logic summary:
  1. Convert both frames to grayscale + blur (reduces noise)
  2. Absolute difference against baseline
  3. Otsu threshold to get binary mask
  4. Morphological cleanup (erode then dilate)
  5. Find external contours
  6. Filter by area, circularity, darkness in source
  7. Reject candidates that overlap confirmed detections
  8. Compute composite confidence score
  9. Return list of DetectionCandidate dataclasses
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import cv2
import numpy as np


# ── Data containers ──────────────────────────────────────────────────────────

@dataclass
class DetectionCandidate:
    """A potential new bullet hole found by the pipeline."""
    # Pixel coordinates in the processed frame
    px: float
    py: float
    pr: float  # radius in pixels
    # Normalised coordinates (0.0–1.0) relative to frame size
    x: float
    y: float
    radius: float
    confidence: float
    # Sub-scores for diagnostics
    circularity: float = 0.0
    darkness: float = 0.0
    area_score: float = 0.0


@dataclass
class PipelineConfig:
    """Runtime detection parameters — mirrors app Settings."""
    min_area: float = 25.0
    max_area: float = 1500.0
    min_circularity: float = 0.35
    darkness_threshold: int = 120   # 0–255; pixel must be DARKER than this
    confidence_threshold: float = 0.55
    blur_kernel: int = 5            # must be odd
    dilate_iterations: int = 2
    erode_iterations: int = 1
    # Minimum diff magnitude — skips expensive contour phase if scene is static
    min_diff_magnitude: float = 3.0


# ── Preprocessing ────────────────────────────────────────────────────────────

def preprocess(frame: np.ndarray, kernel: int = 5) -> np.ndarray:
    """Convert BGR frame to blurred grayscale."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (kernel, kernel), 1.5)
    return blurred


# ── Diff and threshold ───────────────────────────────────────────────────────

def compute_diff_mask(
    baseline_gray: np.ndarray,
    current_gray: np.ndarray,
    config: PipelineConfig,
) -> tuple[np.ndarray, float]:
    """
    Returns:
        mask  — binary uint8 mask of changed regions
        magnitude — mean absolute diff (cheap early-exit signal)
    """
    diff = cv2.absdiff(baseline_gray, current_gray)
    magnitude = float(np.mean(diff))

    if magnitude < config.min_diff_magnitude:
        # Scene essentially unchanged — return empty mask fast
        return np.zeros_like(diff, dtype=np.uint8), magnitude

    # Otsu threshold automatically picks the best value
    _, mask = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Morphological: erode removes single-pixel noise, dilate fills holes
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.erode(mask, kernel, iterations=config.erode_iterations)
    mask = cv2.dilate(mask, kernel, iterations=config.dilate_iterations)

    return mask, magnitude


# ── Contour analysis ─────────────────────────────────────────────────────────

def circularity(area: float, perimeter: float) -> float:
    """4π·area / perimeter². Returns 0 if perimeter is 0."""
    if perimeter < 1e-6:
        return 0.0
    return (4.0 * math.pi * area) / (perimeter ** 2)


def _area_score(area: float, min_area: float, max_area: float) -> float:
    """Gaussian-shaped score peaking at the middle of the expected area range."""
    mid = (min_area + max_area) / 2.0
    sigma = (max_area - min_area) / 4.0
    return float(np.exp(-0.5 * ((area - mid) / sigma) ** 2))


def _darkness_score(mean_val: float, threshold: int) -> float:
    """
    Reward darker pixels. Returns 1.0 if mean_val == 0, 0.0 if mean_val >= threshold.
    """
    if mean_val >= threshold:
        return 0.0
    return 1.0 - (mean_val / threshold)


def _overlaps_existing(
    cx: float, cy: float, cr: float,
    existing: list[tuple[float, float, float]],
) -> bool:
    """
    Returns True if circle (cx, cy, cr) overlaps any circle in `existing`.
    existing: list of (x, y, r) in pixel coords.
    """
    for ex, ey, er in existing:
        dist = math.hypot(cx - ex, cy - ey)
        if dist < (cr + er) * 0.8:  # 80% overlap = same hole
            return True
    return False


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run_pipeline(
    baseline_gray: np.ndarray,
    current_frame: np.ndarray,
    config: PipelineConfig,
    confirmed_circles: list[tuple[float, float, float]] | None = None,
) -> list[DetectionCandidate]:
    """
    Full detection pass.

    Args:
        baseline_gray:      Pre-processed (blurred grayscale) baseline frame.
        current_frame:      Raw BGR frame from camera.
        config:             Detection parameters.
        confirmed_circles:  Already-confirmed detections as pixel (x, y, r) tuples —
                            new candidates overlapping these are suppressed.

    Returns:
        List of DetectionCandidate objects above the confidence threshold.
    """
    h, w = current_frame.shape[:2]
    confirmed_circles = confirmed_circles or []

    current_gray = preprocess(current_frame, config.blur_kernel)
    mask, magnitude = compute_diff_mask(baseline_gray, current_gray, config)

    if magnitude < config.min_diff_magnitude:
        return []  # nothing changed, skip contour analysis

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates: list[DetectionCandidate] = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < config.min_area or area > config.max_area:
            continue

        perimeter = cv2.arcLength(cnt, True)
        circ = circularity(area, perimeter)
        if circ < config.min_circularity:
            continue

        # Bounding enclosing circle
        (cx, cy), cr = cv2.minEnclosingCircle(cnt)
        cx, cy, cr = float(cx), float(cy), float(cr)

        if _overlaps_existing(cx, cy, cr, confirmed_circles):
            continue

        # Darkness check in the original (non-blurred) source frame
        cnt_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(cnt_mask, [cnt], -1, 255, -1)
        source_gray = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY)
        mean_val = float(cv2.mean(source_gray, mask=cnt_mask)[0])

        if mean_val >= config.darkness_threshold:
            continue  # not dark enough to be a hole

        # Composite confidence
        dark_score = _darkness_score(mean_val, config.darkness_threshold)
        area_sc = _area_score(area, config.min_area, config.max_area)
        # Normalise circularity: perfect circle = 1.0
        circ_norm = min(circ, 1.0)
        confidence = 0.4 * circ_norm + 0.3 * dark_score + 0.3 * area_sc

        if confidence < config.confidence_threshold:
            continue

        candidates.append(
            DetectionCandidate(
                px=cx, py=cy, pr=cr,
                x=cx / w, y=cy / h, radius=cr / min(w, h),
                confidence=round(confidence, 4),
                circularity=round(circ_norm, 4),
                darkness=round(dark_score, 4),
                area_score=round(area_sc, 4),
            )
        )

    return candidates
