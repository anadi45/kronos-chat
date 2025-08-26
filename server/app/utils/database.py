from app.database import engine, Base
from app.models import User

def init_db():
    """Initialize database with Alembic migrations if available, otherwise create tables directly"""
    try:
        # Try to import Alembic and run migrations
        from alembic.config import Config
        from alembic import command
        import os
        
        # Check if alembic directory exists
        if os.path.exists("alembic"):
            print("Running database migrations...")
            alembic_cfg = Config("alembic.ini")
            command.upgrade(alembic_cfg, "head")
            print("Database migrations completed successfully!")
        else:
            # Fallback to creating tables directly
            print("Alembic not found, creating tables directly...")
            Base.metadata.create_all(bind=engine)
    except ImportError:
        # Alembic not installed, fallback to creating tables directly
        print("Alembic not installed, creating tables directly...")
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        # Any other error, fallback to creating tables directly
        print(f"Error running migrations: {e}")
        print("Falling back to creating tables directly...")
        Base.metadata.create_all(bind=engine)

def drop_db():
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)