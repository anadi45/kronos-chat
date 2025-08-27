"""
Database configuration and management.
"""
import logging
from typing import Generator, AsyncGenerator
from contextlib import contextmanager, asynccontextmanager

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings

logger = logging.getLogger("kronos.database")

# Database configuration
settings = get_settings()

# Create synchronous engine
engine = create_engine(
    settings.database.url,
    echo=settings.database.echo,
    pool_size=settings.database.pool_size,
    max_overflow=settings.database.max_overflow,
    # Add connection pool settings for better performance
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create async engine (for future async operations)
async_engine = None
AsyncSessionLocal = None

# Check if we can create async engine (PostgreSQL supports it)
if settings.database.url.startswith(("postgresql", "asyncpg")):
    try:
        # Convert sync URL to async URL
        async_url = settings.database.url.replace("postgresql://", "postgresql+asyncpg://")
        async_engine = create_async_engine(
            async_url,
            echo=settings.database.echo,
            pool_size=settings.database.pool_size,
            max_overflow=settings.database.max_overflow,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        
        AsyncSessionLocal = async_sessionmaker(
            async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        logger.info("Async database engine initialized successfully")
    except Exception as e:
        logger.warning(f"Could not initialize async engine: {e}")

# Base class for declarative models
Base = declarative_base()

# Metadata for schema management
metadata = MetaData()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async dependency to get database session.
    
    Yields:
        AsyncSession: SQLAlchemy async database session
    """
    if AsyncSessionLocal is None:
        raise RuntimeError("Async database session not available")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Async database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


@contextmanager
def get_db_context():
    """
    Context manager for database session.
    
    Usage:
        with get_db_context() as db:
            # Use db session
            pass
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database context error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


@asynccontextmanager
async def get_async_db_context():
    """
    Async context manager for database session.
    
    Usage:
        async with get_async_db_context() as db:
            # Use async db session
            pass
    """
    if AsyncSessionLocal is None:
        raise RuntimeError("Async database session not available")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            logger.error(f"Async database context error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


def create_tables():
    """Create all database tables."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def drop_tables():
    """Drop all database tables."""
    logger.info("Dropping database tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("Database tables dropped successfully")


async def create_tables_async():
    """Create all database tables asynchronously."""
    if async_engine is None:
        raise RuntimeError("Async database engine not available")
    
    logger.info("Creating database tables asynchronously...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully (async)")


async def drop_tables_async():
    """Drop all database tables asynchronously."""
    if async_engine is None:
        raise RuntimeError("Async database engine not available")
    
    logger.info("Dropping database tables asynchronously...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    logger.info("Database tables dropped successfully (async)")


def init_db():
    """
    Initialize database with Alembic migrations if available.
    Falls back to creating tables directly if Alembic is not available.
    """
    try:
        # Try to import Alembic and run migrations
        from alembic.config import Config
        from alembic import command
        import os
        
        # Check if alembic directory exists
        if os.path.exists("alembic"):
            logger.info("Running database migrations with Alembic...")
            alembic_cfg = Config("alembic.ini")
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations completed successfully!")
        else:
            # Fallback to creating tables directly
            logger.info("Alembic directory not found, creating tables directly...")
            create_tables()
    except ImportError:
        # Alembic not installed, fallback to creating tables directly
        logger.info("Alembic not installed, creating tables directly...")
        create_tables()
    except Exception as e:
        # Any other error, fallback to creating tables directly
        logger.error(f"Error running migrations: {e}")
        logger.info("Falling back to creating tables directly...")
        create_tables()


def check_db_connection() -> bool:
    """
    Check if database connection is working.
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        with get_db_context() as db:
            # Simple query to test connection
            db.execute("SELECT 1")
        logger.info("Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False


async def check_async_db_connection() -> bool:
    """
    Check if async database connection is working.
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    if AsyncSessionLocal is None:
        logger.warning("Async database session not available")
        return False
    
    try:
        async with get_async_db_context() as db:
            # Simple query to test connection
            await db.execute("SELECT 1")
        logger.info("Async database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Async database connection test failed: {e}")
        return False
