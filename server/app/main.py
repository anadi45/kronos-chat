from fastapi import FastAPI
from app.routes import chat, users, agent
from app.routes.composio import router as composio_router
from app.utils import init_db

def create_app() -> FastAPI:
    app = FastAPI(
        title="Kronos Chat Server",
        description="A FastAPI backend for the Kronos chat application",
        version="0.1.0"
    )
    
    # Initialize the database
    init_db()
    
    # Include routers
    app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
    app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    app.include_router(agent.router, prefix="/api/v1", tags=["agent"])
    app.include_router(composio_router, prefix="/api/v1/composio", tags=["composio"])
    
    @app.get("/")
    async def root():
        return {"message": "Welcome to the Kronos Chat Server"}
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app