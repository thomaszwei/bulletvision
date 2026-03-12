"""
Optional ORB-based frame alignment.

When the camera moves slightly between baseline capture and current frame,
this module computes a homography and warps the current frame to align
with the baseline before diffing.

Disabled by default (adds ~40–80 ms on Pi 4). Enable via settings.
"""
from __future__ import annotations

import cv2
import numpy as np


_orb = cv2.ORB_create(nfeatures=500)
_bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)


def align_frame(
    baseline_gray: np.ndarray,
    current_gray: np.ndarray,
    min_matches: int = 15,
) -> np.ndarray:
    """
    Align current_gray to the coordinate space of baseline_gray using ORB + homography.

    Returns the warped current_gray, or current_gray unchanged if alignment fails
    (fewer than min_matches good keypoint matches found).
    """
    kp1, des1 = _orb.detectAndCompute(baseline_gray, None)
    kp2, des2 = _orb.detectAndCompute(current_gray, None)

    if des1 is None or des2 is None or len(des1) < min_matches or len(des2) < min_matches:
        return current_gray

    matches = _bf.match(des1, des2)
    matches = sorted(matches, key=lambda m: m.distance)

    if len(matches) < min_matches:
        return current_gray

    # Use best 70% of matches
    good = matches[: max(min_matches, int(len(matches) * 0.7))]

    src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)

    H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)
    if H is None:
        return current_gray

    h, w = baseline_gray.shape[:2]
    aligned = cv2.warpPerspective(current_gray, H, (w, h))
    return aligned
