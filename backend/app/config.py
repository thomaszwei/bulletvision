"""
BulletVision backend — application settings.
All values read from environment variables (or .env file via pydantic-settings).
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = Field(
        default="sqlite+aiosqlite:////app/data/db/bulletvision.db"
    )
    data_dir: str = Field(default="/app/data")

    # ── Camera ───────────────────────────────────────────────────────────────
    demo_mode: bool = Field(default=False)
    camera_device: str = Field(default="/dev/video0")
    # AUTO: auto-detect (prefers PICAMERA2 on Raspberry Pi), or set V4L2 | PICAMERA2
    camera_backend: str = Field(default="AUTO")  # AUTO | V4L2 | PICAMERA2
    camera_width: int = Field(default=640)
    camera_height: int = Field(default=480)
    detection_fps: int = Field(default=3)

    # ── CV detection defaults ─────────────────────────────────────────────────
    detection_min_area: float = Field(default=25.0)
    detection_max_area: float = Field(default=1500.0)
    detection_circularity: float = Field(default=0.35)
    detection_darkness_threshold: int = Field(default=120)
    detection_confidence_threshold: float = Field(default=0.55)
    detection_alignment_enabled: bool = Field(default=False)

    # ── Scoring ───────────────────────────────────────────────────────────────
    points_per_hole: int = Field(default=10)
    zone_scoring_enabled: bool = Field(default=False)


# Singleton — import this everywhere
settings = Settings()
