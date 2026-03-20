from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse

from app.services.camera_service import camera_service
from app.config import settings

router = APIRouter()


@router.get("/status")
async def camera_status():
    """Returns camera availability, current FPS, and resolution."""
    return {
        "available": camera_service.available,
        "fps": round(camera_service.fps_actual, 1),
        "width": settings.camera_width,
        "height": settings.camera_height,
        "demo_mode": settings.demo_mode,
        "backend": settings.camera_backend,
        "focus_supported": camera_service.focus_supported,
        "focus_mode": camera_service.focus_mode_applied,
        "focus_requested_mode": settings.camera_autofocus_mode,
    }


@router.get("/stream")
async def mjpeg_stream():
    """
    Live MJPEG stream.
    Consumed by <img src="/api/camera/stream"> or the nginx-proxied equivalent.
    """
    return StreamingResponse(
        camera_service.mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=bulletframe",
    )


@router.post("/snapshot")
async def take_snapshot():
    """Capture a single frame and save it to disk. Returns the file path and URL."""
    import cv2
    import time
    from pathlib import Path

    frame = camera_service.get_frame()
    if frame is None:
        return JSONResponse({"error": "Camera not available"}, status_code=503)

    ts = int(time.time() * 1000)
    snap_dir = Path(settings.data_dir) / "snapshots"
    snap_dir.mkdir(parents=True, exist_ok=True)
    filename = f"snapshot_{ts}.jpg"
    filepath = snap_dir / filename
    cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return {"path": str(filepath), "url": f"/snapshots/{filename}"}
