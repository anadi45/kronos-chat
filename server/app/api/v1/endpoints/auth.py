"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....core.deps import get_database_session, get_current_user
from ....schemas.user import UserSignup, UserLogin, Token, UserProfile
from ....services.auth_service import auth_service

router = APIRouter()


@router.post("/signup", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def signup(
    user_signup: UserSignup,
    db: Session = Depends(get_database_session)
):
    """
    Register a new user.
    
    Args:
        user_signup: User signup data
        db: Database session
        
    Returns:
        UserProfile: Created user profile
        
    Raises:
        ValidationError: If user already exists or validation fails
    """
    try:
        user = auth_service.create_user(db, user_signup)
        return UserProfile.from_orm(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.post("/login", response_model=Token)
async def login(
    user_login: UserLogin,
    db: Session = Depends(get_database_session)
):
    """
    Authenticate user and return access token.
    
    Args:
        user_login: User login credentials
        db: Database session
        
    Returns:
        Token: JWT access token
        
    Raises:
        AuthenticationError: If authentication fails
    """
    try:
        token = auth_service.login_user(db, user_login)
        return token
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.get("/me", response_model=UserProfile)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_database_session)
):
    """
    Get current user information.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        UserProfile: User profile information
    """
    try:
        user = auth_service.get_user_by_email(db, current_user["email"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return UserProfile.from_orm(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )


@router.post("/logout")
async def logout(
    current_user: dict = Depends(get_current_user)
):
    """
    Logout current user.
    
    Note: In a real implementation, this would invalidate the JWT token
    (e.g., by adding it to a blacklist or using short-lived tokens with refresh tokens).
    For now, this is a placeholder since JWTs are stateless.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        dict: Success message
    """
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token(
    current_user: dict = Depends(get_current_user)
):
    """
    Refresh access token.
    
    Note: This is a placeholder for token refresh functionality.
    In production, implement proper refresh token validation and new token generation.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        dict: Placeholder message
    """
    return {"message": "Token refresh not implemented yet"}
