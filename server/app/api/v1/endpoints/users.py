"""
User management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ....core.deps import get_database_session, validate_pagination
from ....core.exceptions import NotFoundError, ValidationError
from ....models.user import User
from ....schemas.user import UserCreate, UserUpdate, UserInDB

router = APIRouter()


@router.get("/", response_model=List[UserInDB])
async def get_users(
    pagination: tuple[int, int] = Depends(validate_pagination),
    db: Session = Depends(get_database_session)
):
    """Get list of users with pagination."""
    skip, limit = pagination
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserInDB)
async def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_database_session)
):
    """Get a specific user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise NotFoundError("User", str(user_id))
    return user


@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_database_session)
):
    """Create a new user."""
    # Check if username already exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise ValidationError("Username already registered", field="username")
    
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise ValidationError("Email already registered", field="email")
    
    # Create new user
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: uuid.UUID,
    user: UserUpdate,
    db: Session = Depends(get_database_session)
):
    """Update an existing user."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise NotFoundError("User", str(user_id))
    
    # Update user fields
    update_data = user.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_database_session)
):
    """Delete a user."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise NotFoundError("User", str(user_id))
    
    db.delete(db_user)
    db.commit()
    return
