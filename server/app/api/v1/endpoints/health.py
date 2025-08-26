"""
Health check endpoints.
"""
from fastapi import APIRouter, Depends

from ....core.deps import check_database_health, check_composio_health, check_gemini_health
from ....core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy"}


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with all service statuses."""
    health_status = {
        "status": "healthy",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        "version": settings.app.version,
        "environment": settings.app.environment,
        "services": {}
    }
    
    # Check database
    try:
        db_healthy = await check_database_health()
        health_status["services"]["database"] = {
            "status": "healthy" if db_healthy else "unhealthy",
            "configured": True
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "error",
            "configured": True,
            "error": str(e)
        }
    
    # Check Composio
    health_status["services"]["composio"] = await check_composio_health()
    
    # Check Gemini
    health_status["services"]["gemini"] = await check_gemini_health()
    
    # Determine overall status
    service_statuses = [
        service["status"] for service in health_status["services"].values()
    ]
    
    if any(status in ["unhealthy", "error"] for status in service_statuses):
        health_status["status"] = "degraded"
    
    return health_status


@router.get("/database")
async def database_health():
    """Check database health."""
    try:
        is_healthy = await check_database_health()
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "configured": True
        }
    except Exception as e:
        return {
            "status": "error",
            "configured": True,
            "error": str(e)
        }


@router.get("/composio")
async def composio_health():
    """Check Composio service health."""
    return await check_composio_health()


@router.get("/gemini")
async def gemini_health():
    """Check Gemini AI service health."""
    return await check_gemini_health()
