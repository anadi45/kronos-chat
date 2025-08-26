"""
Main entry point for Kronos Chat Server.
"""
from app.main import app, settings

if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.app.host,
        port=settings.app.port,
        reload=settings.app.reload or settings.app.is_development,
        log_level=settings.app.log_level.lower(),
        access_log=settings.app.debug
    )