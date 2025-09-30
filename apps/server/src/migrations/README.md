# Database Migrations

This directory contains TypeORM migrations for the Quark Chat application.

## Getting Started

### Prerequisites
- PostgreSQL database running
- Environment variables configured (see .env.example)

### Available Commands

Run these commands from the server directory (`apps/server/`):

```bash
# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Generate a new migration based on entity changes
npm run migration:generate -- src/migrations/YourMigrationName

# Create an empty migration file
npm run migration:create -- src/migrations/YourMigrationName
```

**Note:** All migration commands should be run from the `apps/server/` directory, not from the project root.

## Migration Workflow

### 1. After Entity Changes
When you modify entities, generate a migration:
```bash
cd apps/server
npm run migration:generate -- src/migrations/UpdateUserTable
```

### 2. Review Generated Migration
Always review the generated migration file before running it to ensure it does what you expect.

### 3. Run Migration
Apply the migration to your database:
```bash
cd apps/server
npm run migration:run
```

### 4. Version Control
Commit the migration file to version control along with your entity changes.

## Best Practices

### Migration Naming
Use descriptive names with timestamps:
- `1700000000000-CreateUserTable.ts`
- `1700000001000-AddEmailIndexToUser.ts`
- `1700000002000-AddChatMessagesTable.ts`

### Migration Content
- Always include both `up()` and `down()` methods
- Use transactions when possible
- Add proper indexes for performance
- Include data migrations when needed
- Test migrations on a copy of production data

### Safety Guidelines
- Never edit existing migrations that have been run in production
- Always backup your database before running migrations in production
- Test migrations on staging environment first
- Use migrations for schema changes, not for data manipulation in production

## Troubleshooting

### Migration Fails
1. Check database connection
2. Verify migration syntax
3. Check for conflicting schema changes
4. Review migration logs

### Rollback Issues
If you need to rollback multiple migrations:
```bash
npm run migration:revert  # Reverts last migration
npm run migration:revert  # Reverts second-to-last migration
# Repeat as needed
```

### Reset Database (Development Only)
```bash
# Drop all tables and re-run all migrations
# WARNING: This will delete all data
npm run migration:revert  # Revert all
npm run migration:run     # Re-apply all
```

## File Structure
```
src/migrations/
├── README.md                           # This file
├── 1700000000000-CreateUserTable.ts    # Initial user table
└── utils/
    ├── migration-helpers.ts            # Common migration utilities
    └── seed-data.ts                    # Development seed data
```
