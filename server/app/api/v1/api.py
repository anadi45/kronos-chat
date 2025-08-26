"""
Main API router for v1 endpoints.
"""
from fastapi import APIRouter

from .endpoints import auth, users, chat, agent, composio, health

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

api_router.include_router(
    chat.router,
    prefix="/chat",
    tags=["chat"]
)

api_router.include_router(
    agent.router,
    prefix="/agent",
    tags=["agent"]
)

api_router.include_router(
    composio.router,
    prefix="/composio",
    tags=["composio"]
)
