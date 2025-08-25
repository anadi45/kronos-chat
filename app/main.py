from fastapi import FastAPI
from app.routes import chat, users

def create_app() -> FastAPI:
    app = FastAPI(
        title="Kronos Chat Server",
        description="A FastAPI backend for the Kronos chat application",
        version="0.1.0"
    )
    
    # Include routers
    app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
    app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    
    @app.get("/")
    async def root():
        return {"message": "Welcome to the Kronos Chat Server"}
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app