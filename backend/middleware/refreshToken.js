const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

/**
 * Refresh Token System
 * Implements secure token refresh mechanism with rotation
 */

// In-memory store for refresh tokens (use Redis in production)
const refreshTokenStore = new Map();

/**
 * Generate access and refresh tokens
 */
function generateTokenPair(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Store refresh token
  refreshTokenStore.set(refreshToken, {
    userId,
    expiresAt: refreshTokenExpiry,
    createdAt: new Date(),
    used: false
  });

  return { accessToken, refreshToken, refreshTokenExpiry };
}

/**
 * Validate and use refresh token
 */
async function useRefreshToken(refreshToken) {
  const tokenData = refreshTokenStore.get(refreshToken);

  if (!tokenData) {
    throw new Error('Invalid refresh token');
  }

  if (tokenData.used) {
    // Token reuse detected - potential security breach
    // Invalidate all tokens for this user
    await invalidateUserTokens(tokenData.userId);
    throw new Error('Refresh token already used - all sessions invalidated');
  }

  if (new Date() > tokenData.expiresAt) {
    refreshTokenStore.delete(refreshToken);
    throw new Error('Refresh token expired');
  }

  // Mark token as used (token rotation)
  tokenData.used = true;
  refreshTokenStore.set(refreshToken, tokenData);

  // Generate new token pair
  const newTokens = generateTokenPair(tokenData.userId);

  // Delete old refresh token after a grace period (5 minutes)
  setTimeout(() => {
    refreshTokenStore.delete(refreshToken);
  }, 5 * 60 * 1000);

  return newTokens;
}

/**
 * Invalidate all tokens for a user
 */
async function invalidateUserTokens(userId) {
  for (const [token, data] of refreshTokenStore.entries()) {
    if (data.userId === userId) {
      refreshTokenStore.delete(token);
    }
  }
}

/**
 * Revoke a specific refresh token
 */
function revokeRefreshToken(refreshToken) {
  return refreshTokenStore.delete(refreshToken);
}

/**
 * Clean up expired tokens (run periodically)
 */
function cleanupExpiredTokens() {
  const now = new Date();
  for (const [token, data] of refreshTokenStore.entries()) {
    if (now > data.expiresAt) {
      refreshTokenStore.delete(token);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

/**
 * Express middleware for refresh token endpoint
 */
async function refreshTokenMiddleware(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: { message: 'Refresh token required', status: 400 }
      });
    }

    const tokens = await useRefreshToken(refreshToken);

    // Get user data
    const result = await pool.query(
      'SELECT user_id, email, first_name, last_name, role FROM users WHERE user_id = $1',
      [tokens.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 }
      });
    }

    res.json({
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Refresh token error:', error);

    if (error.message.includes('already used')) {
      return res.status(401).json({
        error: {
          message: 'Security alert: Token reuse detected. Please login again.',
          status: 401,
          code: 'TOKEN_REUSE_DETECTED'
        }
      });
    }

    res.status(401).json({
      error: {
        message: error.message || 'Invalid refresh token',
        status: 401
      }
    });
  }
}

/**
 * Database-backed refresh token storage (for production)
 */
class DatabaseRefreshTokenStore {
  async init() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        revoked BOOLEAN DEFAULT FALSE,
        device_info JSONB,
        ip_address VARCHAR(45)
      )
    `;

    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    `;

    await pool.query(createTableQuery);
    await pool.query(createIndexQuery);
  }

  async store(token, userId, expiresAt, deviceInfo = null, ipAddress = null) {
    await pool.query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at, device_info, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [token, userId, expiresAt, deviceInfo ? JSON.stringify(deviceInfo) : null, ipAddress]
    );
  }

  async get(token) {
    const result = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE`,
      [token]
    );
    return result.rows[0] || null;
  }

  async markUsed(token) {
    await pool.query(
      'UPDATE refresh_tokens SET used = TRUE WHERE token = $1',
      [token]
    );
  }

  async revoke(token) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
      [token]
    );
  }

  async revokeAllForUser(userId) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [userId]
    );
  }

  async cleanupExpired() {
    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW() RETURNING *'
    );
    return result.rowCount;
  }

  async getUserTokens(userId) {
    const result = await pool.query(
      `SELECT token, created_at, expires_at, device_info, ip_address, used
       FROM refresh_tokens
       WHERE user_id = $1 AND revoked = FALSE
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

// Initialize database store if enabled
let dbStore = null;
if (process.env.USE_DB_REFRESH_TOKENS === 'true') {
  dbStore = new DatabaseRefreshTokenStore();
  dbStore.init().then(() => {
    console.log('✓ Database refresh token store initialized');
  }).catch(err => {
    console.error('Failed to initialize database refresh token store:', err);
  });
}

module.exports = {
  generateTokenPair,
  useRefreshToken,
  invalidateUserTokens,
  revokeRefreshToken,
  cleanupExpiredTokens,
  refreshTokenMiddleware,
  DatabaseRefreshTokenStore
};
