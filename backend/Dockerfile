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

# ── libcamera / picamera2 (Raspberry Pi arm64/armhf only) ───────────────────
# On Pi hardware the official Raspberry Pi apt archive provides libcamera
# and picamera2 as system packages. Skipped silently on amd64 dev machines.
RUN set -eux; \
    ARCH=$(dpkg --print-architecture); \
    if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "armhf" ]; then \
        apt-get update && apt-get install -y --no-install-recommends gnupg curl; \
        curl -fsSL https://archive.raspberrypi.org/debian/raspberrypi.gpg.key \
            | gpg --dearmor -o /usr/share/keyrings/raspberrypi-archive-keyring.gpg; \
        echo "deb [signed-by=/usr/share/keyrings/raspberrypi-archive-keyring.gpg] \
http://archive.raspberrypi.org/debian/ bookworm main" \
            > /etc/apt/sources.list.d/raspi.list; \
        apt-get update && apt-get install -y --no-install-recommends \
            libcamera0 \
            libcamera-ipa \
            python3-libcamera \
            python3-picamera2 \
            python3-kms++ \
            python3-prctl \
            libatlas-base-dev; \
        rm -rf /var/lib/apt/lists/*; \
    else \
        echo "Non-Pi arch ($ARCH): skipping libcamera/picamera2 install."; \
    fi

# Expose apt-installed python3-picamera2 to Docker's /usr/local Python binary
ENV PYTHONPATH="/usr/lib/python3/dist-packages:${PYTHONPATH:-}"

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
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Create data directories (will be overridden by volume mount on Pi)
RUN mkdir -p /app/data/db /app/data/snapshots /app/data/demo

EXPOSE 8000

# Run migrations (with retries) then start server.
CMD ["/bin/sh", "./entrypoint.sh"]
