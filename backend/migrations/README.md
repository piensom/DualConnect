# Database Migrations

This directory contains database migration files for the Dual Connect platform.

## Usage

### Create a new migration

```bash
npm run migrate:create add_user_preferences
```

This creates a new migration file with the current timestamp.

### Run pending migrations

```bash
npm run migrate:up
```

### Rollback last migration

```bash
npm run migrate:down
```

### Check migration status

```bash
npm run migrate:list
```

## Migration File Format

Migrations are SQL files with the following format:

```sql
-- Migration: Description of what this migration does
-- Created at: 2024-01-15T10:30:00.000Z

-- UP
CREATE TABLE example (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- DOWN
DROP TABLE IF EXISTS example;
```

The `-- UP` section contains the migration SQL, and the `-- DOWN` section contains the rollback SQL.

## Best Practices

1. **Always test migrations** on a development database first
2. **Write both UP and DOWN** sections for every migration
3. **Keep migrations atomic** - each migration should do one thing
4. **Never modify** executed migrations - create a new one instead
5. **Use transactions** - the migration system wraps each migration in a transaction
6. **Document complex migrations** with comments explaining the changes

## Example Migrations

### Adding a column

```sql
-- UP
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false;

-- DOWN
ALTER TABLE users DROP COLUMN phone_verified;
```

### Creating an index

```sql
-- UP
CREATE INDEX idx_users_email ON users(email);

-- DOWN
DROP INDEX idx_users_email;
```

### Data migration

```sql
-- UP
UPDATE programs
SET language_requirement = 'B2'
WHERE language_requirement IS NULL;

-- DOWN
-- Cannot rollback data changes
```
