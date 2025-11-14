#!/usr/bin/env node

/**
 * Database Migration System
 * Simple migration runner for PostgreSQL
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dualconnect',
  user: process.env.DB_USER || 'dualconnect_user',
  password: process.env.DB_PASSWORD,
});

const MIGRATIONS_DIR = __dirname;
const MIGRATIONS_TABLE = 'migrations';

/**
 * Create migrations table if it doesn't exist
 */
async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(query);
  console.log('✓ Migrations table ready');
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations() {
  const result = await pool.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`
  );
  return result.rows.map(row => row.name);
}

/**
 * Get list of migration files
 */
async function getMigrationFiles() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files
    .filter(file => file.match(/^\d{14}_.*\.sql$/))
    .sort();
}

/**
 * Execute a migration file
 */
async function executeMigration(filename, direction = 'up') {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const content = await fs.readFile(filepath, 'utf8');

  // Split into up and down sections
  const sections = content.split(/-- (UP|DOWN)/i);

  let sql;
  if (direction === 'up') {
    sql = sections[2] || content; // Content after "-- UP"
  } else {
    sql = sections[4] || ''; // Content after "-- DOWN"
  }

  if (!sql.trim()) {
    throw new Error(`No ${direction.toUpperCase()} section found in migration ${filename}`);
  }

  // Execute migration
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);

    if (direction === 'up') {
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
        [filename]
      );
    } else {
      await client.query(
        `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`,
        [filename]
      );
    }

    await client.query('COMMIT');
    console.log(`✓ Executed ${filename} (${direction})`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run pending migrations
 */
async function migrateUp() {
  console.log('Running migrations...\n');

  await createMigrationsTable();

  const executed = await getExecutedMigrations();
  const files = await getMigrationFiles();
  const pending = files.filter(file => !executed.includes(file));

  if (pending.length === 0) {
    console.log('✓ No pending migrations');
    return;
  }

  console.log(`Found ${pending.length} pending migration(s):\n`);

  for (const file of pending) {
    await executeMigration(file, 'up');
  }

  console.log('\n✓ All migrations completed successfully');
}

/**
 * Rollback last migration
 */
async function migrateDown() {
  console.log('Rolling back last migration...\n');

  await createMigrationsTable();

  const executed = await getExecutedMigrations();

  if (executed.length === 0) {
    console.log('✓ No migrations to rollback');
    return;
  }

  const lastMigration = executed[executed.length - 1];
  console.log(`Rolling back: ${lastMigration}\n`);

  await executeMigration(lastMigration, 'down');

  console.log('\n✓ Rollback completed successfully');
}

/**
 * Create a new migration file
 */
async function createMigration(name) {
  if (!name) {
    console.error('❌ Migration name is required');
    console.log('Usage: npm run migrate:create <migration_name>');
    process.exit(1);
  }

  const timestamp = new Date().toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14);

  const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- UP
-- Write your migration here


-- DOWN
-- Write your rollback here

`;

  await fs.writeFile(filepath, template);
  console.log(`✓ Created migration: ${filename}`);
}

/**
 * List migrations status
 */
async function listMigrations() {
  await createMigrationsTable();

  const executed = await getExecutedMigrations();
  const files = await getMigrationFiles();

  console.log('\nMigration Status:\n');
  console.log('Executed migrations:');
  executed.forEach(name => console.log(`  ✓ ${name}`));

  const pending = files.filter(file => !executed.includes(file));
  if (pending.length > 0) {
    console.log('\nPending migrations:');
    pending.forEach(name => console.log(`  ⧗ ${name}`));
  }

  console.log(`\nTotal: ${executed.length} executed, ${pending.length} pending\n`);
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'up':
        await migrateUp();
        break;

      case 'down':
        await migrateDown();
        break;

      case 'create':
        await createMigration(arg);
        break;

      case 'list':
      case 'status':
        await listMigrations();
        break;

      default:
        console.log(`
Database Migration Tool

Usage:
  npm run migrate:up              Run all pending migrations
  npm run migrate:down            Rollback last migration
  npm run migrate:create <name>   Create a new migration file
  npm run migrate:list            List migrations status

Examples:
  npm run migrate:create add_user_preferences_table
  npm run migrate:up
  npm run migrate:down
        `);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateUp, migrateDown, createMigration, listMigrations };
