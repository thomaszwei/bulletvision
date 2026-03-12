"""
Typed WebSocket event builders.
Events follow: { "type": <string>, "data": <dict> }
"""
from __future__ import annotations


def build_detection_new_event(detection) -> dict:
    return {
        "type": "detection_new",
        "data": {
            "id": detection.id,
            "session_id": detection.session_id,
            "player_id": detection.player_id,
            "x": detection.x,
            "y": detection.y,
            "radius": detection.radius,
            "confidence": detection.confidence,
            "status": detection.status,
            "annotated_path": detection.annotated_path,
            "detected_at": detection.detected_at.isoformat() if detection.detected_at else None,
        },
    }


def build_detection_updated_event(detection) -> dict:
    return {
        "type": "detection_updated",
        "data": {
            "id": detection.id,
            "session_id": detection.session_id,
            "player_id": detection.player_id,
            "x": detection.x,
            "y": detection.y,
            "radius": detection.radius,
            "confidence": detection.confidence,
            "status": detection.status,
            "updated_at": detection.updated_at.isoformat() if detection.updated_at else None,
        },
    }
