from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
import json


class UserBase(BaseModel):
    """Base user model with common fields."""
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    email: EmailStr = Field(..., description="Valid email address")
    full_name: Optional[str] = Field(None, max_length=255, description="Full name")


class UserCreate(UserBase):
    """User creation model."""
    bio: Optional[str] = Field(None, max_length=1000, description="User biography")
    preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences as JSON")
    
    @validator('preferences')
    def validate_preferences(cls, v):
        """Validate preferences JSON."""
        if v is not None:
            try:
                # Ensure it's serializable
                json.dumps(v)
            except (TypeError, ValueError):
                raise ValueError("Preferences must be a valid JSON object")
        return v


class UserUpdate(BaseModel):
    """User update model with optional fields."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = Field(None, max_length=500)
    preferences: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    
    @validator('preferences')
    def validate_preferences(cls, v):
        """Validate preferences JSON."""
        if v is not None:
            try:
                json.dumps(v)
            except (TypeError, ValueError):
                raise ValueError("Preferences must be a valid JSON object")
        return v


class UserInDB(UserBase):
    """User model as stored in database."""
    id: int
    is_active: bool
    is_superuser: bool
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @validator('preferences', pre=True)
    def parse_preferences(cls, v):
        """Parse preferences from JSON string if needed."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v
    
    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Public user information (without sensitive data)."""
    id: int
    username: str
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfile(UserPublic):
    """Extended user profile information."""
    email: EmailStr
    is_active: bool
    preferences: Optional[Dict[str, Any]] = None
    last_login: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True