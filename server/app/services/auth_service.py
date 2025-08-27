"""Authentication service for user management and JWT tokens."""
import logging
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models.user import User
from ..schemas.user import UserCreate, UserSignup, UserLogin, Token, TokenData
from ..core.config import get_settings

logger = logging.getLogger("kronos.services.auth")


class AuthService:
    """Authentication service for handling user auth operations."""
    
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash."""
        return self.pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        settings = get_settings()
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.security.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.security.secret_key, 
            algorithm=settings.security.algorithm
        )
        return encoded_jwt
    
    def verify_token(self, token: str) -> TokenData:
        """Verify and decode JWT token."""
        settings = get_settings()
        try:
            payload = jwt.decode(
                token, 
                settings.security.secret_key, 
                algorithms=[settings.security.algorithm]
            )
            email: str = payload.get("sub")
            if email is None:
                logger.warning("Invalid token payload")
                return
            token_data = TokenData(email=email)
        except JWTError:
            logger.warning("Invalid token")
            return
        return token_data
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, db: Session, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user
    
    def create_user(self, db: Session, user_signup: UserSignup) -> User:
        """Create a new user."""
        # Check if user already exists
        if self.get_user_by_email(db, user_signup.email):
            logger.info(f"Email already registered: {user_signup.email}")
            return
        
        # Create user with hashed password
        hashed_password = self.get_password_hash(user_signup.password)
        user_data = UserCreate(
            email=user_signup.email,
            password=hashed_password,
            first_name=user_signup.first_name,
            last_name=user_signup.last_name
        )
        
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
        
        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError:
            db.rollback()
            logger.info(f"Email already registered: {user_signup.email}")
            return
    
    def login_user(self, db: Session, user_login: UserLogin) -> Token:
        """Login user and return JWT token."""
        user = self.authenticate_user(db, user_login.email, user_login.password)
        if not user:
            logger.info("Invalid email or password")
            return
        
        if not user.is_active:
            logger.info("Account is deactivated")
            return
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create access token
        settings = get_settings()
        access_token_expires = timedelta(minutes=settings.security.access_token_expire_minutes)
        access_token = self.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.security.access_token_expire_minutes * 60
        )


# Create singleton instance
auth_service = AuthService()
