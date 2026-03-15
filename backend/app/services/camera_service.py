"""
Camera service — manages frame capture and MJPEG streaming.

Two modes:
  1. V4L2 / OpenCV VideoCapture  — works on any Linux including Pi with v4l2-utils
  2. picamera2 (libcamera)        — set CAMERA_BACKEND=PICAMERA2 on Raspberry Pi OS
  3. Demo mode                    — cycles through sample JPEG files

The service runs a background thread that continuously grabs frames.
The latest raw frame is stored in `self.latest_frame` (numpy BGR array).
A blurred grayscale version for diffing is in `self.latest_processed`.

MJPEG stream is delivered via an async generator (SSE-style multipart).
"""
from __future__ import annotations

import asyncio
import logging
import os
import threading
import time
from pathlib import Path

import cv2
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)


class CameraService:
    def __init__(self) -> None:
        self._cap: cv2.VideoCapture | None = None
        self._picam2 = None  # picamera2.Picamera2 instance, lazily imported

        self.latest_frame: np.ndarray | None = None
        self.latest_processed: np.ndarray | None = None  # blurred grayscale

        self._lock = threading.Lock()
        self._running = False
        self._thread: threading.Thread | None = None

        # Demo mode: list of sample frame paths
        self._demo_frames: list[Path] = []
        self._demo_idx: int = 0

        # Camera health
        self.available: bool = False
        self.fps_actual: float = 0.0
        self._frame_count: int = 0
        self._fps_ts: float = 0.0

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def start(self) -> None:
        """Called on app startup."""
        if settings.demo_mode:
            await self._load_demo_frames()
        else:
            self._open_camera()

        self._running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True, name="camera")
        self._thread.start()
        logger.info(f"Camera service started. demo={settings.demo_mode} available={self.available}")

    async def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=3)
        if self._cap:
            self._cap.release()
        if self._picam2:
            try:
                self._picam2.stop()
            except Exception:
                pass
        logger.info("Camera service stopped.")

    # ── Camera initialisation ─────────────────────────────────────────────────

    def _open_camera(self) -> None:
        backend = settings.camera_backend.upper()

        # AUTO mode: prefer picamera2 on Raspberry Pi if available
        if backend == "AUTO":
            try:
                # Quick platform check: Raspberry Pi device-tree model
                model_path = Path("/proc/device-tree/model")
                if model_path.exists():
                    model = model_path.read_text(errors="ignore")
                    if "Raspberry" in model or "raspberry" in model:
                        backend = "PICAMERA2"
                # If picamera2 is importable, prefer it
                if backend == "AUTO":
                    import importlib

                    if importlib.util.find_spec("picamera2") is not None:
                        backend = "PICAMERA2"
            except Exception:
                backend = "V4L2"

        if backend == "PICAMERA2":
            self._open_picamera2()
        else:
            self._open_v4l2()

    def _open_v4l2(self) -> None:
        try:
            self._cap = cv2.VideoCapture(settings.camera_device, cv2.CAP_V4L2)
            if not self._cap.isOpened():
                # Fallback: try index 0
                self._cap = cv2.VideoCapture(0)
            if self._cap.isOpened():
                self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, settings.camera_width)
                self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, settings.camera_height)
                self._cap.set(cv2.CAP_PROP_FPS, settings.detection_fps * 2)
                self.available = True
                logger.info(f"V4L2 camera opened: {settings.camera_device}")
            else:
                logger.warning("V4L2 camera not available. Frames will be blank.")
        except Exception as exc:
            logger.warning(f"V4L2 open failed: {exc}")

    def _open_picamera2(self) -> None:
        try:
            from picamera2 import Picamera2  # type: ignore[import]

            # Log what libcamera can see before trying to open a specific index.
            # An empty list here means IPA tuning files or device nodes are missing.
            cameras = Picamera2.global_camera_info()
            logger.info(f"libcamera detected {len(cameras)} camera(s): {cameras}")
            if not cameras:
                raise RuntimeError(
                    "libcamera found no cameras. "
                    "Check: ribbon cable, /dev/media* access, and that "
                    "/usr/share/libcamera/ipa/* tuning files exist inside the container."
                )

            self._picam2 = Picamera2(0)
            config = self._picam2.create_video_configuration(
                main={"size": (settings.camera_width, settings.camera_height), "format": "RGB888"}
            )
            self._picam2.configure(config)
            self._picam2.start()
            self.available = True
            logger.info("picamera2 opened successfully.")
        except Exception as exc:
            logger.warning(f"picamera2 open failed ({exc}). Falling back to V4L2.")
            self._open_v4l2()

    async def _load_demo_frames(self) -> None:
        demo_dir = Path(settings.data_dir) / "demo"
        self._demo_frames = sorted(demo_dir.glob("*.jpg")) + sorted(demo_dir.glob("*.png"))
        if self._demo_frames:
            self.available = True
            logger.info(f"Demo mode: {len(self._demo_frames)} sample frames loaded.")
        else:
            # Generate a synthetic blank grey frame as fallback
            logger.info("Demo mode: no sample frames found, using synthetic frame.")
            self.available = True

    # ── Capture loop (background thread) ─────────────────────────────────────

    def _capture_loop(self) -> None:
        interval = 1.0 / (settings.detection_fps * 2)  # capture 2× detection rate
        self._fps_ts = time.monotonic()

        while self._running:
            t0 = time.monotonic()

            frame = self._grab_frame()
            if frame is not None:
                from app.cv.pipeline import preprocess
                processed = preprocess(frame, settings.detection_fps)
                with self._lock:
                    self.latest_frame = frame
                    self.latest_processed = processed
                    self._frame_count += 1

            # Rolling FPS
            elapsed = time.monotonic() - self._fps_ts
            if elapsed >= 2.0:
                self.fps_actual = self._frame_count / elapsed
                self._frame_count = 0
                self._fps_ts = time.monotonic()

            sleep_time = interval - (time.monotonic() - t0)
            if sleep_time > 0:
                time.sleep(sleep_time)

    def _grab_frame(self) -> np.ndarray | None:
        if settings.demo_mode:
            return self._grab_demo_frame()
        if self._picam2:
            return self._grab_picamera2()
        if self._cap and self._cap.isOpened():
            ret, frame = self._cap.read()
            return frame if ret else None
        return None

    def _grab_demo_frame(self) -> np.ndarray | None:
        if not self._demo_frames:
            # Synthetic frame: dark grey with noise
            frame = np.full((settings.camera_height, settings.camera_width, 3), 60, dtype=np.uint8)
            noise = np.random.randint(0, 15, frame.shape, dtype=np.uint8)
            return cv2.add(frame, noise)
        path = self._demo_frames[self._demo_idx % len(self._demo_frames)]
        self._demo_idx += 1
        frame = cv2.imread(str(path))
        if frame is None:
            return None
        return cv2.resize(frame, (settings.camera_width, settings.camera_height))

    def _grab_picamera2(self) -> np.ndarray | None:
        try:
            rgb = self._picam2.capture_array()
            return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        except Exception as exc:
            logger.debug(f"picamera2 capture error: {exc}")
            return None

    # ── Public API ────────────────────────────────────────────────────────────

    def get_frame(self) -> np.ndarray | None:
        """Thread-safe snapshot of the latest frame."""
        with self._lock:
            return self.latest_frame.copy() if self.latest_frame is not None else None

    def get_processed(self) -> np.ndarray | None:
        """Thread-safe snapshot of the latest preprocessed (blurred gray) frame."""
        with self._lock:
            return self.latest_processed.copy() if self.latest_processed is not None else None

    async def mjpeg_generator(self):
        """
        Async generator that yields MJPEG multipart frames.
        Each yielded value is a bytes chunk including multipart boundary.
        """
        boundary = b"--bulletframe"
        target_interval = 1.0 / max(settings.detection_fps, 1)
        while True:
            t0 = asyncio.get_running_loop().time()
            frame = self.get_frame()
            if frame is not None:
                _, jpg = cv2.imencode(
                    ".jpg", frame,
                    [cv2.IMWRITE_JPEG_QUALITY, 75]
                )
                jpg_bytes = jpg.tobytes()
                yield (
                    boundary + b"\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpg_bytes)).encode() + b"\r\n\r\n"
                    + jpg_bytes + b"\r\n"
                )
            else:
                # Send blank placeholder frame when camera is unavailable
                placeholder = _make_placeholder_frame(
                    settings.camera_width, settings.camera_height
                )
                _, jpg = cv2.imencode(".jpg", placeholder)
                jpg_bytes = jpg.tobytes()
                yield (
                    boundary + b"\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpg_bytes)).encode() + b"\r\n\r\n"
                    + jpg_bytes + b"\r\n"
                )

            elapsed = asyncio.get_running_loop().time() - t0
            sleep = max(0.0, target_interval - elapsed)
            await asyncio.sleep(sleep)


def _make_placeholder_frame(w: int, h: int) -> np.ndarray:
    """Dark frame with a 'No Camera' label."""
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    cv2.putText(
        frame, "No Camera Signal", (w // 2 - 120, h // 2),
        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (120, 120, 120), 1, cv2.LINE_AA,
    )
    return frame


# Singleton
camera_service = CameraService()
