from app.database import engine, Base
from app.models import User

def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def drop_db():
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)