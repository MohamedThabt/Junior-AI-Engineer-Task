"""API route definitions."""

from fastapi import APIRouter, Request

from config.limiter import limiter

router = APIRouter()


@router.get("/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    """Health check endpoint."""
    return {"status": "healthy"}
