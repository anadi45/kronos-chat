from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from ..core.database import Base

class User(Base):
    __tablename__ = "users"
    
    # Use UUID for better scalability and security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # User identifiers with constraints
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # Name fields with reasonable limits
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    
    # User status and profile
    is_active = Column(Boolean, default=True, nullable=False)
    profile_image_url = Column(String(2048), nullable=True)  # URLs can be long
    
    # Timestamps with timezone
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', active={self.is_active})>"
    
    def to_dict(self):
        """Convert user model to dictionary."""
        return {
            "id": str(self.id),  # Convert UUID to string for JSON serialization
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "is_active": self.is_active,
            "profile_image_url": self.profile_image_url,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @property
    def full_name(self):
        """Property to get full name from first and last name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return None