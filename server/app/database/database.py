from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Handle settings import gracefully for Alembic
try:
    from app.config import settings
    DATABASE_URL = settings.database_url
except ImportError:
    # Default database URL for Alembic
    DATABASE_URL = "postgresql://kronos_user:kronos_password@localhost:5432/kronos_chat"

# Create the SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

def get_db():
    """Dependency to get a database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()