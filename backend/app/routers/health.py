from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    """Basic liveness probe used by Docker healthcheck and nginx."""
    return JSONResponse({"status": "ok", "service": "bulletvision-backend"})
