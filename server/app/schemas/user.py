from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import uuid


class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr = Field(..., description="Valid email address")
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")


class UserCreate(UserBase):
    """User creation model."""
    pass


class UserUpdate(BaseModel):
    """User update model with optional fields."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    profile_image_url: Optional[str] = Field(None, max_length=2048)
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """User model as stored in database."""
    id: uuid.UUID
    is_active: bool
    profile_image_url: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Public user information (without sensitive data)."""
    id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfile(UserPublic):
    """Extended user profile information."""
    email: EmailStr
    is_active: bool
    last_login: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True