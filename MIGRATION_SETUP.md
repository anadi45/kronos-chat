# Database Migration Setup Guide

This guide explains how to set up and use database migrations in the Quark Chat application.

## Quick Start

### 1. Environment Setup

Create a `.env` file in the project root with the following variables:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=kronos_user
DATABASE_PASSWORD=kronos_password
DATABASE_NAME=kronos_chat
DATABASE_LOGGING=false
NODE_ENV=development
```

### 2. Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE kronos_chat;
CREATE USER kronos_user WITH PASSWORD 'kronos_password';
GRANT ALL PRIVILEGES ON DATABASE kronos_chat TO kronos_user;
```

### 3. Run Initial Migration

```bash
# Run the migration to create the users table
npm run migration:run
```

## Available Migration Commands

**Important:** All migration commands must be run from the `apps/server/` directory.

| Command | Description |
|---------|-------------|
| `npm run migration:run` | Execute pending migrations |
| `npm run migration:revert` | Rollback the last migration |
| `npm run migration:show` | Show migration status |
| `npm run migration:generate -- src/migrations/MigrationName` | Generate migration from entity changes |
| `npm run migration:create -- src/migrations/MigrationName` | Create empty migration file |

**Usage:**
```bash
cd apps/server
npm run migration:run
```

## Migration Development Workflow

### 1. Making Entity Changes

When you modify entities in `src/entities/`, follow these steps:

1. Make your entity changes
2. Generate a migration:
   ```bash
   cd apps/server
   npm run migration:generate -- src/migrations/UpdateUserTable
   ```
3. Review the generated migration file
4. Test the migration:
   ```bash
   cd apps/server
   npm run migration:run
   ```

### 2. Creating Custom Migrations

For complex schema changes or data migrations:

1. Create an empty migration:
   ```bash
   cd apps/server
   npm run migration:create -- src/migrations/AddUserRoles
   ```
2. Edit the migration file to include your changes
3. Test the migration

### 3. Production Deployment

1. Backup your production database
2. Run migrations in production:
   ```bash
   cd apps/server
   NODE_ENV=production npm run migration:run
   ```

## Migration Structure

```
apps/server/src/migrations/
├── README.md                           # Migration documentation
├── 1700000000000-CreateUserTable.ts    # Initial user table migration
├── utils/
│   ├── migration-helpers.ts            # Common migration utilities
│   └── seed-data.ts                    # Development seed data
```

## Utilities

### Migration Helpers

The `MigrationHelpers` class provides common functions:

- `getUuidPrimaryKeyColumn()` - Standard UUID primary key
- `getTimestampColumns()` - Standard created_at/updated_at columns
- `createIndex()` - Standardized index creation
- `createForeignKey()` - Standardized foreign key creation
- `addUpdatedAtTrigger()` - PostgreSQL trigger for updated_at

### Seed Data

The `SeedData` class provides development utilities:

- `createAdminUser()` - Creates default admin user
- `createSampleUsers()` - Creates sample users for testing
- `isDevelopment()` - Environment check helper

## Best Practices

### Naming Conventions

- Use timestamps in migration names: `1700000000000-CreateUserTable.ts`
- Use descriptive names: `AddEmailIndexToUser`, `CreateChatMessagesTable`
- Follow CamelCase for class names

### Migration Safety

- Always review generated migrations before running
- Include both `up()` and `down()` methods
- Use transactions for complex operations
- Test migrations on development data first
- Never edit migrations that have run in production

### Performance

- Add appropriate indexes for query performance
- Use `MigrationHelpers.createIndex()` for consistent naming
- Consider data size when creating indexes

## Troubleshooting

### Common Issues

1. **Migration fails with "relation already exists"**
   - Check if migration was partially applied
   - Verify migration hasn't been run before

2. **Cannot generate migration from entities**
   - Ensure entities are properly exported
   - Check TypeORM decorators are correct

3. **Permission errors**
   - Verify database user has proper permissions
   - Check database connection settings

### Recovery

If migrations get into a bad state:

1. Check migration status: `npm run migration:show`
2. Revert problematic migrations: `npm run migration:revert`
3. Fix the issue and re-run: `npm run migration:run`

## Configuration Files

### Key Files

- `src/config/data-source.ts` - TypeORM data source for migrations
- `src/config/database.config.ts` - Database configuration for app
- `package.json` - Migration scripts

### Important Settings

- `synchronize: false` - Always use migrations, never auto-sync
- `migrationsRun: false` - Don't auto-run migrations on startup
- `migrations: ['dist/migrations/*.js']` - Compiled migration path
