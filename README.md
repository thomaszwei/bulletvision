# BulletVision 🎯

Self-hosted Raspberry Pi web application that uses the Pi camera to **detect new bullet holes** on a target in real time. Supports multiplayer, scoring, session history, and runs entirely in Docker.

---

## Quick Start

### Requirements
- Raspberry Pi 4 (2 GB+ RAM recommended)
- Pi Camera Module v2/HQ **or** USB webcam
- Docker Engine + Docker Compose v2
- A light-coloured shooting target

### 1. Clone & configure

```bash
git clone https://github.com/thomaszwei/bulletvision.git
cd bulletvision
cp .env.example .env
# Edit .env — set CAMERA_BACKEND, SECRET_KEY, etc.
```

### 2. Run (production)

```bash
docker compose up --build -d
```

Open `http://<pi-ip>` in any browser on the same network.

### 3. Run (development — hot-reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Backend API: `http://localhost:8000`
- Frontend (Vite): `http://localhost:5173`
- Proxied entry: `http://localhost`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `changeme` | Used for session signing |
| `CAMERA_BACKEND` | `v4l2` | `v4l2` / `picamera2` / `demo` |
| `DEMO_MODE` | `false` | Synthetic frames (no camera) |
| `DETECTION_FPS` | `3` | CV pipeline frames per second |
| `CAMERA_DEVICE` | `/dev/video0` | V4L2 device path |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `LOG_LEVEL` | `info` | Uvicorn log level |

See `.env.example` for the full list.

---

## Architecture

```
Browser
  │
  ▼
nginx :80
  ├── /api/*      → FastAPI :8000  (REST + MJPEG stream)
  ├── /ws/*       → FastAPI :8000  (WebSockets)
  ├── /snapshots/ → FastAPI :8000  (static files)
  └── /*          → nginx :80      (React SPA)
```

### Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.111 + Python 3.11 + Uvicorn |
| CV | OpenCV 4.9 headless + NumPy |
| Camera | V4L2 → picamera2 → demo fallback |
| Database | SQLite (async via aiosqlite + SQLAlchemy 2) |
| Migrations | Alembic |
| Frontend | React 18 + Vite 5 + TypeScript + Tailwind CSS |
| State | Zustand + TanStack Query |
| Realtime | FastAPI WebSockets (auto-reconnect) |
| Video | MJPEG stream (`<img src>`) |
| Container | Docker Compose v2 |
| Proxy | nginx 1.25-alpine |

---

## How It Works

1. **Baseline capture** — take a clean snapshot of the empty target.
2. **Frame differencing** — every frame is subtracted from the baseline; new dark circular regions are bullet hole candidates.
3. **Confidence scoring** — each candidate is scored by circularity, darkness, and area. Only those above the threshold are reported.
4. **Review** — confirm ✓ or reject ✕ each detection via the Live Session UI or overlay buttons.
5. **Scoring** — confirmed hits award points to the active player; achievements unlock at milestones.

---

## Project Structure

```
bulletvision/
├── backend/
│   ├── app/
│   │   ├── cv/          # Detection pipeline + annotation
│   │   ├── models/      # SQLAlchemy ORM models
│   │   ├── routers/     # FastAPI route handlers
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Camera, detection, scoring, session
│   │   └── ws/          # WebSocket manager + router
│   ├── alembic/         # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios API clients
│   │   ├── components/  # Shared UI components
│   │   ├── hooks/       # React hooks
│   │   ├── pages/       # Page components
│   │   ├── store/       # Zustand stores
│   │   └── types/       # TypeScript types
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf       # Production reverse proxy
│   └── nginx.dev.conf   # Development proxy (Vite)
├── docker-compose.yml
└── docker-compose.dev.yml
```

---

## Camera Setup

### Raspberry Pi Camera (CSI)
Set `CAMERA_BACKEND=picamera2` in `.env`. Ensure `libcamera` is available on the Pi (pre-installed on Raspberry Pi OS Bookworm).

### USB Webcam / V4L2
Set `CAMERA_BACKEND=v4l2`. The device is passed through to the container in `docker-compose.yml`:
```yaml
devices:
  - /dev/video0:/dev/video0
```
Change `/dev/video0` if your camera is on a different device node.

### Demo Mode
`CAMERA_BACKEND=demo` — no camera required. Synthetic frames with moving bullet holes are generated for testing.

---

## Tips for Good Detection

- Mount the camera **perpendicular** to the target.
- Use **consistent, diffuse lighting** — avoid direct sunlight.
- Use a **plain white or light target**.
- Don't move camera or target after capturing the baseline.
- If you get false positives, raise **Confidence Threshold** in Settings.

---

## Commands

```bash
# View live logs
docker compose logs -f

# Run database migrations manually
docker compose exec backend alembic upgrade head

# Shell into backend container
docker compose exec backend bash

# Rebuild a single service
docker compose up --build backend -d
```

---

## License

MIT
