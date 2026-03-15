"""
BulletVision — FastAPI application factory.

Startup order:
  1. Ensure data directories exist
  2. Run Alembic migrations (production) or create_all (dev)
  3. Seed default settings rows
  4. Start camera service background thread
  5. Mount routers

All services are lazily imported to avoid circular deps.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings

logger = logging.getLogger("bulletvision")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s | %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup → yield → shutdown."""
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("BulletVision backend starting…")

    # Ensure data directories exist
    for subdir in ("db", "snapshots", "snapshots/baselines", "snapshots/frames", "demo"):
        os.makedirs(os.path.join(settings.data_dir, subdir), exist_ok=True)

    # Import here to avoid circular import at module level
    from app.database import engine, Base

    # Create all tables (Alembic handles migrations; this is a safety net for dev)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default settings if the table is empty
    from app.services.settings_service import seed_default_settings
    await seed_default_settings()

    # Start camera service
    from app.services.camera_service import camera_service
    await camera_service.start()

    logger.info("BulletVision ready.")
    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("BulletVision shutting down…")
    # Cancel any running detection loop task first
    from app.services.detection_service import stop_detection_loop
    stop_detection_loop()
    # Then stop the camera thread
    from app.services.camera_service import camera_service
    await camera_service.stop()


# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="BulletVision API",
        version="1.0.0",
        description="Raspberry Pi bullet hole detection system",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # CORS — allow frontend dev server and same-origin in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # Vite dev server
            "http://localhost",
            "http://localhost:80",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Register routers ───────────────────────────────────────────────────────
    from app.routers import (
        health,
        camera,
        sessions,
        players,
        detections,
        scores,
        calibration,
        app_settings,
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(camera.router, prefix="/api/camera", tags=["Camera"])
    app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
    app.include_router(players.router, prefix="/api/players", tags=["Players"])
    app.include_router(detections.router, prefix="/api/detections", tags=["Detections"])
    app.include_router(scores.router, prefix="/api/scores", tags=["Scores"])
    app.include_router(calibration.router, prefix="/api/calibration", tags=["Calibration"])
    app.include_router(app_settings.router, prefix="/api/settings", tags=["Settings"])

    from app.routers import system as system_router_mod
    app.include_router(system_router_mod.router, prefix="/api/system", tags=["System"])

    # ── WebSocket ──────────────────────────────────────────────────────────────
    from app.ws.router import ws_router
    app.include_router(ws_router)

    # Serve snapshot images from the data directory
    snapshots_dir = os.path.join(settings.data_dir, "snapshots")
    os.makedirs(snapshots_dir, exist_ok=True)
    app.mount("/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")

    return app


app = create_app()
