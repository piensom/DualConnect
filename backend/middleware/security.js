const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const crypto = require('crypto');

/**
 * XSS Protection Middleware
 * Sanitizes all request inputs to prevent XSS attacks
 */
function sanitizeInputs(req, res, next) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? xss(item) :
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * CSRF Token Generator
 */
class CSRFProtection {
  constructor() {
    this.tokens = new Map();
    // Clean up expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 3600000);
  }

  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour
    this.tokens.set(sessionId, { token, expiry });
    return token;
  }

  validateToken(sessionId, token) {
    const stored = this.tokens.get(sessionId);
    if (!stored) return false;
    if (stored.expiry < Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }
    return stored.token === token;
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (data.expiry < now) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

const csrfProtection = new CSRFProtection();

/**
 * CSRF Token Middleware for state-changing operations
 */
function requireCSRFToken(req, res, next) {
  const token = req.headers['x-csrf-token'];
  const sessionId = req.headers['x-session-id'] || req.ip;

  if (!token || !csrfProtection.validateToken(sessionId, token)) {
    return res.status(403).json({
      error: 'Invalid or missing CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
}

/**
 * Generate CSRF token endpoint
 */
function getCSRFToken(req, res) {
  const sessionId = req.headers['x-session-id'] || req.ip;
  const token = csrfProtection.generateToken(sessionId);
  res.json({ csrfToken: token });
}

/**
 * SQL Injection Protection Helpers
 */
function validateDatabaseInput(input, type = 'string') {
  if (input === null || input === undefined) return input;

  switch (type) {
    case 'integer':
      const num = parseInt(input, 10);
      if (isNaN(num)) throw new Error('Invalid integer value');
      return num;

    case 'uuid':
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(input)) throw new Error('Invalid UUID format');
      return input;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) throw new Error('Invalid email format');
      return input.toLowerCase();

    case 'alphanumeric':
      if (!/^[a-zA-Z0-9_-]+$/.test(input)) throw new Error('Invalid alphanumeric value');
      return input;

    case 'string':
    default:
      // Remove null bytes and control characters
      return String(input).replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  }
}

/**
 * Password Strength Validator
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiting by user ID (for authenticated routes)
 */
const userRateLimits = new Map();

function rateLimitByUser(maxRequests = 100, windowMs = 900000) { // 15 minutes
  return (req, res, next) => {
    if (!req.user || !req.user.user_id) {
      return next();
    }

    const userId = req.user.user_id;
    const now = Date.now();
    const userLimit = userRateLimits.get(userId) || { count: 0, resetTime: now + windowMs };

    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + windowMs;
    }

    userLimit.count++;

    if (userLimit.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }

    userRateLimits.set(userId, userLimit);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - userLimit.count);
    res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());

    next();
  };
}

/**
 * File Upload Security
 */
function validateFileUpload(allowedTypes, maxSize = 5 * 1024 * 1024) { // 5MB default
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];

    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
        });
      }

      // Check file type
      if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`
        });
      }

      // Check for double extensions (potential security risk)
      const fileName = file.originalname;
      const extensions = fileName.split('.').slice(1);
      if (extensions.length > 1) {
        const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'php', 'jsp', 'asp'];
        for (const ext of extensions) {
          if (dangerousExtensions.includes(ext.toLowerCase())) {
            return res.status(400).json({
              error: 'File contains potentially dangerous extension'
            });
          }
        }
      }
    }

    next();
  };
}

module.exports = {
  sanitizeInputs,
  sanitizeObject,
  requireCSRFToken,
  getCSRFToken,
  validateDatabaseInput,
  validatePasswordStrength,
  rateLimitByUser,
  validateFileUpload
};
