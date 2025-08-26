"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ....core.deps import get_app_settings
from ....core.config import Settings
from ....core.exceptions import AuthenticationError

router = APIRouter()


class LoginRequest(BaseModel):
    """Login request model."""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    """User information model."""
    user_id: str
    email: str
    roles: list[str]


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    settings: Settings = Depends(get_app_settings)
):
    """
    Authenticate user and return access token.
    
    Note: This is a mock implementation for demo purposes.
    In production, implement proper authentication with password hashing,
    user database validation, and JWT token generation.
    """
    # Mock authentication - replace with real implementation
    if request.email == "demo@example.com" and request.password == "demo":
        # In production, generate actual JWT token
        mock_token = "demo-token"
        
        return LoginResponse(
            access_token=mock_token,
            token_type="bearer",
            expires_in=settings.security.access_token_expire_minutes * 60
        )
    
    raise AuthenticationError("Invalid email or password")


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    # current_user: dict = Depends(get_current_user)  # Uncomment when implementing real auth
):
    """
    Get current user information.
    
    Note: This is a mock implementation for demo purposes.
    """
    # Mock user info - replace with real user data
    return UserInfo(
        user_id="demo-user",
        email="demo@example.com",
        roles=["user"]
    )


@router.post("/logout")
async def logout():
    """
    Logout current user.
    
    Note: In a real implementation, this would invalidate the JWT token
    (e.g., by adding it to a blacklist or using short-lived tokens with refresh tokens).
    """
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token():
    """
    Refresh access token.
    
    Note: This is a placeholder for token refresh functionality.
    In production, implement proper refresh token validation and new token generation.
    """
    return {"message": "Token refresh not implemented yet"}
