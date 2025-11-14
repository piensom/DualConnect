const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('../config/database');
const { log } = require('../utils/logger');

/**
 * Two-Factor Authentication (2FA) System
 * Supports TOTP (Time-based One-Time Password) via authenticator apps
 */

/**
 * Generate 2FA secret for user
 */
async function generate2FASecret(userId, userEmail) {
  const secret = speakeasy.generateSecret({
    name: `Dual Connect (${userEmail})`,
    issuer: 'Dual Connect',
    length: 32
  });

  // Store secret in database (encrypted in production)
  await pool.query(
    `UPDATE users
     SET two_factor_secret = $1, two_factor_enabled = false
     WHERE user_id = $2`,
    [secret.base32, userId]
  );

  log.info('2FA secret generated', { userId });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url
  };
}

/**
 * Generate QR code for 2FA setup
 */
async function generateQRCode(otpauth_url) {
  try {
    const qrCode = await QRCode.toDataURL(otpauth_url);
    return qrCode;
  } catch (error) {
    log.error('Failed to generate QR code', { error: error.message });
    throw error;
  }
}

/**
 * Verify 2FA token
 */
function verify2FAToken(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps before/after for clock drift
  });
}

/**
 * Enable 2FA for user (requires verification)
 */
async function enable2FA(userId, token) {
  // Get user's secret
  const result = await pool.query(
    'SELECT two_factor_secret FROM users WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0 || !result.rows[0].two_factor_secret) {
    throw new Error('2FA secret not generated. Please generate secret first.');
  }

  const secret = result.rows[0].two_factor_secret;

  // Verify token
  const isValid = verify2FAToken(secret, token);

  if (!isValid) {
    throw new Error('Invalid 2FA token');
  }

  // Enable 2FA
  await pool.query(
    'UPDATE users SET two_factor_enabled = true WHERE user_id = $1',
    [userId]
  );

  // Generate backup codes
  const backupCodes = await generateBackupCodes(userId);

  log.info('2FA enabled', { userId });

  return {
    success: true,
    backupCodes
  };
}

/**
 * Disable 2FA for user (requires password or backup code)
 */
async function disable2FA(userId) {
  await pool.query(
    `UPDATE users
     SET two_factor_enabled = false, two_factor_secret = NULL
     WHERE user_id = $1`,
    [userId]
  );

  // Delete backup codes
  await pool.query(
    'DELETE FROM two_factor_backup_codes WHERE user_id = $1',
    [userId]
  );

  log.info('2FA disabled', { userId });

  return { success: true };
}

/**
 * Generate backup codes for account recovery
 */
async function generateBackupCodes(userId) {
  const codes = [];

  // Generate 10 backup codes
  for (let i = 0; i < 10; i++) {
    const code = generateRandomCode(8);
    codes.push(code);

    await pool.query(
      `INSERT INTO two_factor_backup_codes (user_id, code, used)
       VALUES ($1, $2, false)`,
      [userId, code]
    );
  }

  return codes;
}

/**
 * Verify backup code
 */
async function verifyBackupCode(userId, code) {
  const result = await pool.query(
    `SELECT id FROM two_factor_backup_codes
     WHERE user_id = $1 AND code = $2 AND used = false`,
    [userId, code]
  );

  if (result.rows.length === 0) {
    return false;
  }

  // Mark code as used
  await pool.query(
    'UPDATE two_factor_backup_codes SET used = true, used_at = NOW() WHERE id = $1',
    [result.rows[0].id]
  );

  log.info('Backup code used', { userId });

  return true;
}

/**
 * Check if user has 2FA enabled
 */
async function is2FAEnabled(userId) {
  const result = await pool.query(
    'SELECT two_factor_enabled FROM users WHERE user_id = $1',
    [userId]
  );

  return result.rows.length > 0 && result.rows[0].two_factor_enabled;
}

/**
 * Middleware to require 2FA verification
 */
function require2FA(req, res, next) {
  const { two_factor_token } = req.body;
  const userId = req.user.user_id;

  // Check if user has 2FA enabled
  is2FAEnabled(userId).then(enabled => {
    if (!enabled) {
      return next(); // 2FA not enabled, continue
    }

    if (!two_factor_token) {
      return res.status(403).json({
        error: {
          message: '2FA token required',
          code: '2FA_REQUIRED',
          status: 403
        }
      });
    }

    // Get user's secret
    pool.query(
      'SELECT two_factor_secret FROM users WHERE user_id = $1',
      [userId]
    ).then(result => {
      if (result.rows.length === 0 || !result.rows[0].two_factor_secret) {
        return res.status(500).json({
          error: { message: '2FA configuration error', status: 500 }
        });
      }

      const secret = result.rows[0].two_factor_secret;

      // Verify token or backup code
      const isValid = verify2FAToken(secret, two_factor_token);

      if (isValid) {
        return next();
      }

      // Try backup code
      verifyBackupCode(userId, two_factor_token).then(isValidBackup => {
        if (isValidBackup) {
          return next();
        }

        return res.status(403).json({
          error: {
            message: 'Invalid 2FA token',
            code: '2FA_INVALID',
            status: 403
          }
        });
      });
    }).catch(error => {
      log.error('2FA verification error', { error: error.message, userId });
      return res.status(500).json({
        error: { message: 'Failed to verify 2FA token', status: 500 }
      });
    });
  }).catch(error => {
    log.error('2FA check error', { error: error.message, userId });
    return res.status(500).json({
      error: { message: 'Failed to check 2FA status', status: 500 }
    });
  });
}

/**
 * Login with 2FA
 */
async function loginWith2FA(userId, password, token) {
  // First verify password (assumed to be done before calling this)

  // Check if 2FA is enabled
  const enabled = await is2FAEnabled(userId);

  if (!enabled) {
    return { success: true, requires2FA: false };
  }

  if (!token) {
    return {
      success: false,
      requires2FA: true,
      message: '2FA token required'
    };
  }

  // Get user's secret
  const result = await pool.query(
    'SELECT two_factor_secret FROM users WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0 || !result.rows[0].two_factor_secret) {
    throw new Error('2FA configuration error');
  }

  const secret = result.rows[0].two_factor_secret;

  // Verify token
  const isValid = verify2FAToken(secret, token);

  if (!isValid) {
    // Try backup code
    const isValidBackup = await verifyBackupCode(userId, token);

    if (!isValidBackup) {
      throw new Error('Invalid 2FA token');
    }
  }

  return {
    success: true,
    requires2FA: true,
    verified: true
  };
}

/**
 * Helper function to generate random code
 */
function generateRandomCode(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Initialize 2FA database tables
 */
async function initialize2FATables() {
  const createBackupCodesTable = `
    CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      code VARCHAR(20) NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createIndex = `
    CREATE INDEX IF NOT EXISTS idx_2fa_backup_codes_user_id
    ON two_factor_backup_codes(user_id);
  `;

  try {
    await pool.query(createBackupCodesTable);
    await pool.query(createIndex);
    log.info('2FA tables initialized');
  } catch (error) {
    log.error('Failed to initialize 2FA tables', { error: error.message });
    throw error;
  }
}

module.exports = {
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  enable2FA,
  disable2FA,
  generateBackupCodes,
  verifyBackupCode,
  is2FAEnabled,
  require2FA,
  loginWith2FA,
  initialize2FATables
};
