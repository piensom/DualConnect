#!/usr/bin/env node

/**
 * Automated Database Backup System
 * Supports full backups, incremental backups, and cloud storage
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { log } = require('../utils/logger');

require('dotenv').config();

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DB_NAME = process.env.DB_NAME || 'dualconnect';
const DB_USER = process.env.DB_USER || 'dualconnect_user';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '30');

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    log.info('Backup directory created', { dir: BACKUP_DIR });
  }
}

/**
 * Generate backup filename
 */
function generateBackupFilename(type = 'full') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${DB_NAME}-${type}-${timestamp}.sql`;
}

/**
 * Perform full database backup
 */
async function backupDatabase() {
  await ensureBackupDir();

  const filename = generateBackupFilename('full');
  const filepath = path.join(BACKUP_DIR, filename);

  log.info('Starting database backup', { database: DB_NAME, file: filename });

  try {
    // Use pg_dump to create backup
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -F c -b -v -f "${filepath}" ${DB_NAME}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      log.debug('pg_dump stderr', { stderr });
    }

    // Get file size
    const stats = await fs.stat(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    log.info('Database backup completed', {
      file: filename,
      size: `${sizeMB} MB`,
      path: filepath
    });

    // Cleanup old backups
    await cleanupOldBackups();

    return {
      success: true,
      filename,
      filepath,
      size: stats.size,
      sizeMB
    };
  } catch (error) {
    log.error('Database backup failed', { error: error.message });
    throw error;
  }
}

/**
 * Perform schema-only backup
 */
async function backupSchema() {
  await ensureBackupDir();

  const filename = generateBackupFilename('schema');
  const filepath = path.join(BACKUP_DIR, filename);

  log.info('Starting schema backup', { database: DB_NAME });

  try {
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -s -f "${filepath}" ${DB_NAME}`;

    await execAsync(command);

    const stats = await fs.stat(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    log.info('Schema backup completed', {
      file: filename,
      size: `${sizeMB} MB`
    });

    return {
      success: true,
      filename,
      filepath,
      size: stats.size
    };
  } catch (error) {
    log.error('Schema backup failed', { error: error.message });
    throw error;
  }
}

/**
 * Perform data-only backup (excluding schema)
 */
async function backupData() {
  await ensureBackupDir();

  const filename = generateBackupFilename('data');
  const filepath = path.join(BACKUP_DIR, filename);

  log.info('Starting data backup', { database: DB_NAME });

  try {
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -a -f "${filepath}" ${DB_NAME}`;

    await execAsync(command);

    const stats = await fs.stat(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    log.info('Data backup completed', {
      file: filename,
      size: `${sizeMB} MB`
    });

    return {
      success: true,
      filename,
      filepath,
      size: stats.size
    };
  } catch (error) {
    log.error('Data backup failed', { error: error.message });
    throw error;
  }
}

/**
 * Backup specific tables
 */
async function backupTables(tables = []) {
  await ensureBackupDir();

  const filename = generateBackupFilename('tables');
  const filepath = path.join(BACKUP_DIR, filename);

  log.info('Starting table backup', { tables });

  try {
    const tableArgs = tables.map(t => `-t ${t}`).join(' ');
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${tableArgs} -f "${filepath}" ${DB_NAME}`;

    await execAsync(command);

    const stats = await fs.stat(filepath);

    log.info('Table backup completed', {
      file: filename,
      tables
    });

    return {
      success: true,
      filename,
      filepath,
      tables,
      size: stats.size
    };
  } catch (error) {
    log.error('Table backup failed', { error: error.message });
    throw error;
  }
}

/**
 * Restore database from backup
 */
async function restoreDatabase(backupFile) {
  const filepath = path.join(BACKUP_DIR, backupFile);

  log.info('Starting database restore', { file: backupFile });

  try {
    // Check if backup file exists
    await fs.access(filepath);

    // Warning: This will drop and recreate the database
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c -v "${filepath}"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      log.debug('pg_restore stderr', { stderr });
    }

    log.info('Database restore completed', { file: backupFile });

    return { success: true, file: backupFile };
  } catch (error) {
    log.error('Database restore failed', { error: error.message });
    throw error;
  }
}

/**
 * List all backups
 */
async function listBackups() {
  await ensureBackupDir();

  const files = await fs.readdir(BACKUP_DIR);
  const backups = [];

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filepath);

      backups.push({
        filename: file,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        created: stats.mtime,
        age: getAge(stats.mtime)
      });
    }
  }

  // Sort by creation date (newest first)
  backups.sort((a, b) => b.created - a.created);

  return backups;
}

/**
 * Delete a specific backup
 */
async function deleteBackup(filename) {
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    await fs.unlink(filepath);
    log.info('Backup deleted', { file: filename });
    return { success: true, deleted: filename };
  } catch (error) {
    log.error('Failed to delete backup', { file: filename, error: error.message });
    throw error;
  }
}

/**
 * Cleanup old backups (keep only MAX_BACKUPS newest)
 */
async function cleanupOldBackups() {
  const backups = await listBackups();

  if (backups.length <= MAX_BACKUPS) {
    return { deleted: 0 };
  }

  const toDelete = backups.slice(MAX_BACKUPS);
  let deleted = 0;

  for (const backup of toDelete) {
    try {
      await deleteBackup(backup.filename);
      deleted++;
    } catch (error) {
      log.warn('Failed to delete old backup', { file: backup.filename });
    }
  }

  log.info('Old backups cleaned up', { deleted, kept: MAX_BACKUPS });

  return { deleted };
}

/**
 * Get human-readable age of a date
 */
function getAge(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const count = Math.floor(seconds / secondsInUnit);
    if (count >= 1) {
      return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Compress backup file
 */
async function compressBackup(filename) {
  const filepath = path.join(BACKUP_DIR, filename);

  log.info('Compressing backup', { file: filename });

  try {
    const command = `gzip -f "${filepath}"`;
    await execAsync(command);

    const compressedFile = `${filename}.gz`;
    const stats = await fs.stat(path.join(BACKUP_DIR, compressedFile));

    log.info('Backup compressed', {
      original: filename,
      compressed: compressedFile,
      size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
    });

    return { success: true, filename: compressedFile };
  } catch (error) {
    log.error('Compression failed', { error: error.message });
    throw error;
  }
}

/**
 * Upload backup to S3 (if configured)
 */
async function uploadToS3(filename) {
  if (!process.env.AWS_S3_BUCKET) {
    log.info('S3 upload skipped - no bucket configured');
    return { success: false, reason: 'S3 not configured' };
  }

  const filepath = path.join(BACKUP_DIR, filename);
  const s3Path = `backups/${DB_NAME}/${filename}`;

  log.info('Uploading to S3', { bucket: process.env.AWS_S3_BUCKET, path: s3Path });

  try {
    const command = `aws s3 cp "${filepath}" s3://${process.env.AWS_S3_BUCKET}/${s3Path}`;
    await execAsync(command);

    log.info('Backup uploaded to S3', { path: s3Path });

    return { success: true, s3Path };
  } catch (error) {
    log.error('S3 upload failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Main backup function with all features
 */
async function performFullBackup(options = {}) {
  const {
    compress = true,
    uploadS3 = true,
    type = 'full'
  } = options;

  try {
    // Perform backup
    let result;
    switch (type) {
      case 'schema':
        result = await backupSchema();
        break;
      case 'data':
        result = await backupData();
        break;
      default:
        result = await backupDatabase();
    }

    // Compress if requested
    if (compress) {
      const compressed = await compressBackup(result.filename);
      result.filename = compressed.filename;
    }

    // Upload to S3 if requested
    if (uploadS3) {
      const upload = await uploadToS3(result.filename);
      result.s3 = upload;
    }

    return result;
  } catch (error) {
    log.error('Full backup process failed', { error: error.message });
    throw error;
  }
}

/**
 * CLI interface
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'backup':
        const result = await performFullBackup({
          compress: process.argv.includes('--compress'),
          uploadS3: process.argv.includes('--s3'),
          type: process.argv[3] || 'full'
        });
        console.log('✓ Backup completed:', result);
        break;

      case 'restore':
        const backupFile = process.argv[3];
        if (!backupFile) {
          console.error('Error: Backup file required');
          process.exit(1);
        }
        await restoreDatabase(backupFile);
        console.log('✓ Database restored');
        break;

      case 'list':
        const backups = await listBackups();
        console.log('\nAvailable backups:\n');
        backups.forEach(b => {
          console.log(`${b.filename} (${b.sizeMB} MB, ${b.age})`);
        });
        console.log(`\nTotal: ${backups.length} backup(s)\n`);
        break;

      case 'cleanup':
        const cleaned = await cleanupOldBackups();
        console.log(`✓ Cleaned up ${cleaned.deleted} old backup(s)`);
        break;

      default:
        console.log(`
Database Backup Tool

Usage:
  npm run backup -- backup [type] [options]    Create a backup
  npm run backup -- restore <file>             Restore from backup
  npm run backup -- list                       List all backups
  npm run backup -- cleanup                    Remove old backups

Backup Types:
  full         Complete database backup (default)
  schema       Schema only
  data         Data only

Options:
  --compress   Compress backup with gzip
  --s3         Upload to S3 after backup

Examples:
  npm run backup -- backup
  npm run backup -- backup --compress --s3
  npm run backup -- backup schema
  npm run backup -- restore backup.sql
  npm run backup -- list
  npm run backup -- cleanup
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  backupDatabase,
  backupSchema,
  backupData,
  backupTables,
  restoreDatabase,
  listBackups,
  deleteBackup,
  cleanupOldBackups,
  performFullBackup
};
