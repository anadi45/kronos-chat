"""
Dependency injection for Kronos Chat Server.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import get_settings, Settings
from .database import get_db
from .exceptions import AuthenticationError, ConfigurationError
from .logging import get_logger

logger = get_logger(__name__)

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
        raise AuthenticationError("Missing authentication token")
    
    try:
        from ..services.auth_service import auth_service
        
        # Verify JWT token
        token_data = auth_service.verify_token(credentials.credentials)
        
        # Get user from database
        user = auth_service.get_user_by_email(db, token_data.email)
        if not user:
            raise AuthenticationError("User not found")
        
        if not user.is_active:
            raise AuthenticationError("User account is deactivated")
        
        return {
            "user_id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active
        }
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        if isinstance(e, AuthenticationError):
            raise e
        raise AuthenticationError("Authentication failed")


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
        from .exceptions import AuthorizationError
        raise AuthorizationError("Admin access required")
    
    return current_user


# Service dependencies
def get_composio_service():
    """Get Composio service instance."""
    from ..services.composio_service import composio_service
    
    if not composio_service.initialized:
        raise ConfigurationError(
            "Composio service not initialized. Check COMPOSIO_API_KEY configuration.",
            config_key="COMPOSIO_API_KEY"
        )
    
    return composio_service


def get_optional_composio_service():
    """Get Composio service instance if available, None otherwise."""
    try:
        return get_composio_service()
    except ConfigurationError:
        logger.warning("Composio service not available")
        return None


def get_gemini_service():
    """Get Gemini AI service instance."""
    from ..services.gemini_service import gemini_service
    
    if not gemini_service.initialized:
        raise ConfigurationError(
            "Gemini service not initialized. Check GEMINI_API_KEY configuration.",
            config_key="GEMINI_API_KEY"
        )
    
    return gemini_service


def get_optional_gemini_service():
    """Get Gemini AI service instance if available, None otherwise."""
    try:
        return get_gemini_service()
    except ConfigurationError:
        logger.warning("Gemini service not available")
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
        from .exceptions import ValidationError
        raise ValidationError("User ID must be at least 3 characters long", field="user_id")
    
    if len(user_id) > 50:
        from .exceptions import ValidationError
        raise ValidationError("User ID must be less than 50 characters", field="user_id")
    
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
        from .exceptions import ValidationError
        raise ValidationError("Skip must be non-negative", field="skip")
    
    if limit <= 0:
        from .exceptions import ValidationError
        raise ValidationError("Limit must be positive", field="limit")
    
    if limit > 1000:
        from .exceptions import ValidationError
        raise ValidationError("Limit must not exceed 1000", field="limit")
    
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
        logger.error(f"Database health check failed: {e}")
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
    except ConfigurationError:
        return {
            "status": "unavailable",
            "configured": False,
            "initialized": False,
            "message": "Composio API key not configured"
        }
    except Exception as e:
        logger.error(f"Composio health check failed: {e}")
        return {
            "status": "unhealthy",
            "configured": True,
            "initialized": False,
            "message": str(e)
        }


async def check_gemini_health() -> dict:
    """
    Check Gemini AI service health.
    
    Returns:
        dict: Health status information
    """
    try:
        gemini_service = get_gemini_service()
        return {
            "status": "healthy",
            "configured": True,
            "initialized": gemini_service.initialized
        }
    except ConfigurationError:
        return {
            "status": "unavailable",
            "configured": False,
            "initialized": False,
            "message": "Gemini API key not configured"
        }
    except Exception as e:
        logger.error(f"Gemini health check failed: {e}")
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
GeminiDeps = Depends(get_gemini_service)
OptionalGeminiDeps = Depends(get_optional_gemini_service)
PaginationDeps = Depends(validate_pagination)
