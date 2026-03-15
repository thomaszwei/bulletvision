"""
System stats router — exposes CPU, memory, temperature and camera fps.
Used by the frontend dashboard widget.
"""
from __future__ import annotations

import logging
from typing import Optional

import psutil
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class SystemStats(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    cpu_temp_celsius: Optional[float]   # None on non-Pi or when unavailable
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    camera_fps: Optional[float]


def _read_cpu_temp() -> Optional[float]:
    """Return CPU temperature in °C, or None if unavailable."""
    # Raspberry Pi: thermal_zone0
    try:
        temps = psutil.sensors_temperatures()
        if not temps:
            return None
        for key in ("cpu_thermal", "coretemp", "thermal_zone0", "cpu-thermal"):
            if key in temps and temps[key]:
                return round(temps[key][0].current, 1)
        # Fallback: first available sensor
        first = next(iter(temps.values()))
        if first:
            return round(first[0].current, 1)
    except Exception:
        pass
    return None


@router.get("/stats", response_model=SystemStats)
async def get_system_stats() -> SystemStats:
    """Return current system resource usage and camera stats."""
    from app.services.camera_service import camera_service

    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return SystemStats(
        cpu_percent=round(psutil.cpu_percent(interval=0.2), 1),
        memory_percent=round(mem.percent, 1),
        memory_used_mb=round(mem.used / 1024 / 1024, 1),
        memory_total_mb=round(mem.total / 1024 / 1024, 1),
        cpu_temp_celsius=_read_cpu_temp(),
        disk_percent=round(disk.percent, 1),
        disk_used_gb=round(disk.used / 1024 / 1024 / 1024, 2),
        disk_total_gb=round(disk.total / 1024 / 1024 / 1024, 2),
        camera_fps=round(camera_service.fps_actual, 1) if camera_service.available else None,
    )
