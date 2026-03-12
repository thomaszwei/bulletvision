"""
Perspective calibration helpers.

The operator clicks 4 corner points on the live feed to define the target area.
We compute a perspective warp matrix and store it in the calibration profile.
Subsequent frames are warped before detection so the target always fills the frame.
"""
from __future__ import annotations

import base64
import json

import cv2
import numpy as np


def compute_perspective_matrix(
    src_corners: list[list[float]],
    output_width: int = 640,
    output_height: int = 480,
) -> np.ndarray:
    """
    Compute a 3×3 perspective transform matrix from 4 source corner points.

    src_corners: [[x,y], [x,y], [x,y], [x,y]] in pixel coordinates,
                  order: top-left, top-right, bottom-right, bottom-left.
    Returns the 3×3 float32 matrix.
    """
    src = np.float32(src_corners)
    dst = np.float32([
        [0, 0],
        [output_width - 1, 0],
        [output_width - 1, output_height - 1],
        [0, output_height - 1],
    ])
    return cv2.getPerspectiveTransform(src, dst)


def warp_frame(frame: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Apply perspective warp to a frame."""
    h, w = frame.shape[:2]
    return cv2.warpPerspective(frame, matrix, (w, h))


def matrix_to_b64(matrix: np.ndarray) -> str:
    """Serialise a numpy matrix to a base64 string for DB storage."""
    return base64.b64encode(matrix.astype(np.float32).tobytes()).decode("ascii")


def b64_to_matrix(b64: str) -> np.ndarray:
    """Deserialise a base64 string back to a 3×3 float32 numpy matrix."""
    raw = base64.b64decode(b64)
    return np.frombuffer(raw, dtype=np.float32).reshape(3, 3)
