# Alembic Migrations

This directory contains database migrations for the Kronos Chat application.

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

### Create a new migration:
```bash
cd server
python -m alembic revision --autogenerate -m "Description of changes"
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

### Create a new migration:
```bash
cd server
python -m alembic revision --autogenerate -m "Description of changes"
```

## Migration Workflow

1. Make changes to your models in `app/models/`
2. Create a new migration: `python -m alembic revision --autogenerate -m "Description"`
3. Review the generated migration in `alembic/versions/`
4. Run the migration: `python -m alembic upgrade head`