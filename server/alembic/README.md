# Alembic Migrations

This directory contains database migrations for the Kronos Chat application.

## Current Migration

There is a single migration that creates a professionally designed users table with the following features:

### Table Structure
- **id** (UUID, Primary Key) - Universally unique identifier with default uuid4 generation
- **email** (String(255), Unique, Indexed) - User's email address
- **first_name** (String(100), Optional) - User's first name
- **last_name** (String(100), Optional) - User's last name
- **is_active** (Boolean, Default: true, Indexed) - Account status
- **profile_image_url** (String(2048), Optional) - Profile image URL (supports long URLs)
- **last_login** (DateTime with timezone, Optional) - Timestamp of last login
- **created_at** (DateTime with timezone, Default: now(), Indexed) - Record creation timestamp
- **updated_at** (DateTime with timezone, Default: now(), Indexed) - Record update timestamp

### Constraints and Indexes
- Primary key constraint on id
- Unique constraint on email
- Check constraints for data validity (email length >= 5)
- Indexes on all queryable fields for performance

## Running Migrations

### Initialize the database with migrations:
```bash
cd server
python init_db.py
```

### Upgrade to the latest version:
```bash
cd server
python run_migrations.py --upgrade
```

### Downgrade to the base version:
```bash
cd server
python run_migrations.py --downgrade
```

## Manual Migration Commands

You can also run migrations directly with Alembic:

### Upgrade to the latest version:
```bash
cd server
python -m alembic upgrade head
```

### Downgrade to the base version:
```bash
cd server
python -m alembic downgrade base
```

## Migration Philosophy

This migration follows professional database design principles:
1. Uses UUID for primary keys to ensure global uniqueness and prevent enumeration attacks
2. Proper indexing strategy for common query patterns
3. Data validation through check constraints
4. Separation of concerns (first_name/last_name vs full_name)
5. Reasonable string length limits to prevent abuse
6. Timezone-aware timestamps for global applications
7. Secure by design with UUID-based identifiers