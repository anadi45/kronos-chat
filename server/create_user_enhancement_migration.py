#!/usr/bin/env python3
"""
Create a new Alembic migration for enhanced user model.
"""

import sys
import os
from alembic.config import Config
from alembic import command

def create_migration():
    """Create a new migration for the enhanced user model."""
    try:
        # Create Alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Create migration
        message = "enhance_user_model_with_additional_fields"
        command.revision(
            alembic_cfg, 
            message=message,
            autogenerate=True
        )
        
        print(f"Migration '{message}' created successfully!")
        print("Review the generated migration file before running 'alembic upgrade head'")
        
    except Exception as e:
        print(f"Error creating migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_migration()
