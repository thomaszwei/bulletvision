"""
Frame annotation helpers.
Draw detection markers on BGR frames for snapshots and stream overlays.
"""
from __future__ import annotations

import cv2
import numpy as np


# Colour palette (BGR)
COLOR_PENDING = (0, 200, 255)    # amber
COLOR_CONFIRMED = (50, 200, 80)  # green
COLOR_REJECTED = (80, 80, 80)    # grey
COLOR_TEXT = (255, 255, 255)
FONT = cv2.FONT_HERSHEY_SIMPLEX


def draw_detection(
    frame: np.ndarray,
    px: float,
    py: float,
    pr: float,
    label: str = "",
    status: str = "pending",
    confidence: float | None = None,
) -> np.ndarray:
    """
    Draw a circle + label on a copy of frame.
    px, py, pr are pixel coordinates.
    Returns the annotated copy.
    """
    out = frame.copy()
    cx, cy, cr = int(px), int(py), max(int(pr), 5)

    color = {
        "pending": COLOR_PENDING,
        "confirmed": COLOR_CONFIRMED,
        "rejected": COLOR_REJECTED,
    }.get(status, COLOR_PENDING)

    # Outer ring
    cv2.circle(out, (cx, cy), cr + 4, color, 2, cv2.LINE_AA)
    # Inner dot
    cv2.circle(out, (cx, cy), 3, color, -1, cv2.LINE_AA)

    # Label text
    parts = []
    if label:
        parts.append(label)
    if confidence is not None:
        parts.append(f"{confidence:.0%}")
    text = " ".join(parts)
    if text:
        tx, ty = cx + cr + 6, cy + 4
        cv2.putText(out, text, (tx, ty), FONT, 0.45, (0, 0, 0), 3, cv2.LINE_AA)
        cv2.putText(out, text, (tx, ty), FONT, 0.45, COLOR_TEXT, 1, cv2.LINE_AA)

    return out


def draw_all_detections(
    frame: np.ndarray,
    detections: list[dict],
    frame_width: int,
    frame_height: int,
) -> np.ndarray:
    """
    Draw all detections (each a dict with x, y, radius, status, confidence, id).
    Coordinates are normalised (0–1); convert back to pixels here.
    """
    out = frame.copy()
    for d in detections:
        px = d["x"] * frame_width
        py = d["y"] * frame_height
        pr = d["radius"] * min(frame_width, frame_height)
        label = f"#{d.get('id', '')}"
        out = draw_detection(out, px, py, pr, label, d.get("status", "pending"), d.get("confidence"))
    return out


def draw_baseline_indicator(frame: np.ndarray) -> np.ndarray:
    """Overlay a small 'BASELINE ACTIVE' badge on the frame."""
    out = frame.copy()
    h, w = out.shape[:2]
    cv2.rectangle(out, (8, 8), (200, 34), (0, 0, 0), -1)
    cv2.rectangle(out, (8, 8), (200, 34), (50, 200, 80), 1)
    cv2.putText(out, "BASELINE ACTIVE", (14, 26), FONT, 0.45, (50, 200, 80), 1, cv2.LINE_AA)
    return out
