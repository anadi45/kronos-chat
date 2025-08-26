#!/usr/bin/env python3
"""
Script to run database migrations using Alembic
"""
import sys
import os

# Add the server directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

def main():
    import argparse
    from alembic.config import Config
    from alembic import command
    
    parser = argparse.ArgumentParser(description='Run database migrations')
    parser.add_argument(
        '--upgrade',
        action='store_true',
        help='Upgrade the database to the latest version'
    )
    parser.add_argument(
        '--downgrade',
        action='store_true',
        help='Downgrade the database to the base version'
    )
    parser.add_argument(
        '--revision',
        type=str,
        default='head',
        help='Revision to upgrade/downgrade to (default: head for upgrade, base for downgrade)'
    )
    
    args = parser.parse_args()
    
    # Create Alembic configuration
    alembic_cfg = Config("alembic.ini")
    
    if args.upgrade:
        print(f"Upgrading database to revision: {args.revision}")
        command.upgrade(alembic_cfg, args.revision)
        print("Database upgrade completed successfully!")
    elif args.downgrade:
        revision = args.revision if args.revision != 'head' else 'base'
        print(f"Downgrading database to revision: {revision}")
        command.downgrade(alembic_cfg, revision)
        print("Database downgrade completed successfully!")
    else:
        print("Please specify either --upgrade or --downgrade")
        parser.print_help()

if __name__ == "__main__":
    main()