"""
Main FastAPI application for Kronos Chat Server.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .core.config import get_settings
from .core.database import init_db, check_db_connection
from .core.middleware import setup_middleware
from .api.v1.api import api_router


# Get settings
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Manages startup and shutdown events.
    """
    # Startup
    print(f"Starting {settings.app.name} v{settings.app.version}")
    print(f"Environment: {settings.app.environment}")
    print(f"Debug mode: {settings.app.debug}")
    
    # Initialize database
    try:
        init_db()
        
        # Check database connection
        if check_db_connection():
            print("Database connection verified")
        else:
            print("Database connection failed")
    except Exception as e:
        print(f"Database initialization failed: {e}")
    
    # Initialize services
    try:
        # Initialize Composio service if configured
        if settings.composio:
            from .services import composio_service
            try:
                composio_service.initialize()
                print("Composio service initialized")
            except Exception as e:
                print(f"Composio service initialization failed: {e}")
        

                
    except Exception as e:
        print(f"Service initialization failed: {e}")
    
    print("Application startup complete")
    
    yield
    
    # Shutdown
    print("Application shutdown initiated")
    
    # Cleanup resources here if needed
    
    print("Application shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured application instance
    """
    # Create FastAPI app with lifespan
    app = FastAPI(
        title=settings.app.name,
        description=settings.app.description,
        version=settings.app.version,
        docs_url=settings.app.docs_url if not settings.app.is_production else None,
        redoc_url=settings.app.redoc_url if not settings.app.is_production else None,
        openapi_url=settings.app.openapi_url if not settings.app.is_production else None,
        lifespan=lifespan
    )
    
    
    # Setup middleware
    setup_middleware(app)
    
    # Include API router
    app.include_router(api_router, prefix=settings.app.api_prefix)
    
    # Root endpoint
    @app.get("/", tags=["root"])
    async def root():
        """Root endpoint with basic information."""
        return {
            "name": settings.app.name,
            "version": settings.app.version,
            "description": settings.app.description,
            "environment": settings.app.environment,
            "docs_url": f"{settings.app.api_prefix}/docs" if not settings.app.is_production else None
        }
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        """Comprehensive health check endpoint."""
        from .core.deps import check_database_health, check_composio_health
        
        health_status = {
            "status": "healthy",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "version": settings.app.version,
            "environment": settings.app.environment
        }
        
        # Check database
        try:
            db_healthy = await check_database_health()
            health_status["database"] = {
                "status": "healthy" if db_healthy else "unhealthy",
                "configured": True
            }
        except Exception as e:
            health_status["database"] = {
                "status": "error",
                "configured": True,
                "error": str(e)
            }
        
        # Check Composio
        health_status["composio"] = await check_composio_health()
        
        # Determine overall status
        component_statuses = [
            health_status["database"]["status"],
            health_status["composio"]["status"]
        ]
        
        if any(status == "unhealthy" for status in component_statuses):
            health_status["status"] = "degraded"
        elif any(status == "error" for status in component_statuses):
            health_status["status"] = "unhealthy"
        
        return health_status
    
    print(f"FastAPI application created successfully")
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "app.main:app",
        host=settings.app.host,
        port=settings.app.port,
        reload=settings.app.reload or settings.app.is_development,
        log_level=settings.app.log_level.lower(),
        access_log=settings.app.debug
    )