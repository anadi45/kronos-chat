#!/usr/bin/env python3
"""
Script to initialize the database using Alembic migrations
"""
import sys
import os

# Add the server directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

def main():
    print("Initializing database with Alembic migrations...")
    
    try:
        from alembic.config import Config
        from alembic import command
        
        # Create Alembic configuration
        alembic_cfg = Config("alembic.ini")
        
        # Run migrations to upgrade to the latest version
        command.upgrade(alembic_cfg, "head")
        
        print("Database initialized successfully with migrations!")
        print("You can now start the server.")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()