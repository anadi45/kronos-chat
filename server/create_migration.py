#!/usr/bin/env python3
"""
Script to create new database migrations using Alembic
"""
import sys
import os

# Add the server directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

def main():
    import argparse
    from alembic.config import Config
    from alembic import command
    
    parser = argparse.ArgumentParser(description='Create a new database migration')
    parser.add_argument(
        'message',
        type=str,
        help='Message describing the migration'
    )
    
    args = parser.parse_args()
    
    try:
        # Create Alembic configuration
        alembic_cfg = Config("alembic.ini")
        
        # Create a new migration
        command.revision(alembic_cfg, message=args.message, autogenerate=True)
        
        print(f"New migration created successfully with message: '{args.message}'")
        print("Review the generated migration file in alembic/versions/ before running it.")
        
    except Exception as e:
        print(f"Error creating migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()