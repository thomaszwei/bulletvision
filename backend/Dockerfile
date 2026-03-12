# ─────────────────────────────────────────────────────────────────────────────
# BulletVision Backend Dockerfile
# Multi-stage: "development" stage for hot-reload, "production" for final image.
#
# Base image is debian-based so we can install libcamera / v4l2 system packages
# that picamera2 depends on. We use the official Python slim image (arm64-compatible).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage: base ──────────────────────────────────────────────────────────────
FROM python:3.11-slim-bookworm AS base

# System packages needed by OpenCV headless and v4l2 camera access.
RUN apt-get update && apt-get install -y --no-install-recommends \
    # OpenCV runtime dependencies
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgl1 \
    # v4l2 tools for camera diagnostics
    v4l-utils \
    # curl for healthcheck
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer cache-friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage: development ───────────────────────────────────────────────────────
FROM base AS development
# In dev we mount the source directory, so nothing to COPY here.
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── Stage: production ────────────────────────────────────────────────────────
FROM base AS production

COPY app/ ./app/

# Create data directories (will be overridden by volume mount on Pi)
RUN mkdir -p /app/data/db /app/data/snapshots /app/data/demo

EXPOSE 8000

# Run migrations then start server.
# Migrations are idempotent — safe to run on every startup.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1"]
