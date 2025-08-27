"""
Dependency injection for Kronos Chat Server.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import get_settings, Settings
from .database import get_db

# Security scheme for JWT authentication
security = HTTPBearer(auto_error=False)


# Configuration dependencies
def get_app_settings() -> Settings:
    """Get application settings."""
    return get_settings()


# Database dependencies
def get_database_session() -> Generator[Session, None, None]:
    """Get database session dependency."""
    yield from get_db()


# Authentication dependencies
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_database_session)
) -> dict:
    """
    Get current authenticated user.
    
    Args:
        credentials: JWT token from Authorization header
        db: Database session
        
    Returns:
        dict: User information
        
    Raises:
        AuthenticationError: If authentication fails
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    try:
        from ..services.auth_service import auth_service
        
        # Verify JWT token
        token_data = auth_service.verify_token(credentials.credentials)
        
        # Get user from database
        user = auth_service.get_user_by_email(db, token_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
        
        return {
            "user_id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active
        }
        
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Get current user and verify admin role.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        dict: Admin user information
        
    Raises:
        AuthorizationError: If user is not an admin
    """
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


# Service dependencies
def get_composio_service():
    """Get Composio service instance."""
    from ..services.composio_service import composio_service
    
    if not composio_service.initialized:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Composio service not initialized. Check COMPOSIO_API_KEY configuration."
        )
    
    return composio_service


def get_optional_composio_service():
    """Get Composio service instance if available, None otherwise."""
    try:
        return get_composio_service()
    except HTTPException:
        return None





# Validation dependencies
def validate_user_id(user_id: str) -> str:
    """
    Validate user ID format.
    
    Args:
        user_id: User ID to validate
        
    Returns:
        str: Validated user ID
        
    Raises:
        ValidationError: If user ID is invalid
    """
    if not user_id or len(user_id) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID must be at least 3 characters long"
        )
    
    if len(user_id) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID must be less than 50 characters"
        )
    
    return user_id


def validate_pagination(
    skip: int = 0,
    limit: int = 100
) -> tuple[int, int]:
    """
    Validate pagination parameters.
    
    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return
        
    Returns:
        tuple: Validated (skip, limit) values
        
    Raises:
        ValidationError: If parameters are invalid
    """
    if skip < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skip must be non-negative"
        )
    
    if limit <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be positive"
        )
    
    if limit > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must not exceed 1000"
        )
    
    return skip, limit


# Health check dependencies
async def check_database_health(
    db: Session = Depends(get_database_session)
) -> bool:
    """
    Check database health.
    
    Args:
        db: Database session
        
    Returns:
        bool: True if database is healthy
    """
    try:
        # Simple query to test database connectivity
        db.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False


async def check_composio_health() -> dict:
    """
    Check Composio service health.
    
    Returns:
        dict: Health status information
    """
    try:
        composio_service = get_composio_service()
        return {
            "status": "healthy",
            "configured": True,
            "initialized": composio_service.initialized
        }
    except HTTPException:
        return {
            "status": "unavailable",
            "configured": False,
            "initialized": False,
            "message": "Composio API key not configured"
        }
    except Exception as e:
        print(f"Composio health check failed: {e}")
        return {
            "status": "unhealthy",
            "configured": True,
            "initialized": False,
            "message": str(e)
        }





# Common dependencies combinations
CommonDeps = Depends(get_app_settings)
DatabaseDeps = Depends(get_database_session)
AuthDeps = Depends(get_current_user)
AdminDeps = Depends(get_current_admin_user)
ComposioDeps = Depends(get_composio_service)
OptionalComposioDeps = Depends(get_optional_composio_service)
PaginationDeps = Depends(validate_pagination)
