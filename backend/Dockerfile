# ─────────────────────────────────────────────────────────────────────────────
# BulletVision Backend Dockerfile
# Multi-stage: "development" stage for hot-reload, "production" for final image.
#
# Base image is debian-based so we can install libcamera / v4l2 system packages
# that picamera2 depends on. We use the official Python slim image (arm64-compatible).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage: pip-builder ────────────────────────────────────────────────────────
# Install Python deps here (with build tools available) so that packages that
# have no pre-built arm64 wheel (e.g. greenlet, httptools, uvloop) can compile
# from source.  The compilers are NOT copied into the final image.
FROM python:3.11-slim-bookworm AS pip-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

# Install into an isolated venv so we can COPY the whole tree to the runtime stage.
RUN python -m venv /venv \
    && /venv/bin/pip install --no-cache-dir --upgrade pip \
    && /venv/bin/pip install --no-cache-dir -r requirements.txt


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
        printf 'deb [signed-by=/usr/share/keyrings/raspberrypi-archive-keyring.gpg] http://archive.raspberrypi.org/debian/ bookworm main\n' \
            > /etc/apt/sources.list.d/raspi.list; \
        apt-get update; \
        # Install libcamera-apps (pulls libcamera0, libcamera-ipa, python3-libcamera,
        # python3-kms++ as transitive deps) + picamera2 Python bindings.
        # We don't list versioned soname packages (e.g. libcamera0.3.x) directly
        # because their exact name varies by Pi OS release.
        apt-get install -y --no-install-recommends \
            libcamera-apps \
            python3-picamera2 \
            python3-prctl \
            libatlas-base-dev; \
        rm -rf /var/lib/apt/lists/*; \
    else \
        echo "Non-Pi arch ($ARCH): skipping libcamera/picamera2 install."; \
    fi

# Expose apt-installed python3-picamera2 to the venv Python binary
ENV PYTHONPATH="/usr/lib/python3/dist-packages:${PYTHONPATH:-}"

# Copy compiled Python packages from pip-builder and activate the venv.
COPY --from=pip-builder /venv /venv
ENV PATH="/venv/bin:$PATH"

WORKDIR /app

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
