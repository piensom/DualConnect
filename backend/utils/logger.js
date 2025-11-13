const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format (human-readable)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'dual-connect-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Access logs (separate file)
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.user_id
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.user_id
    });
  });

  next();
}

/**
 * Error logging middleware
 */
function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.user_id,
    body: req.body
  });

  next(err);
}

/**
 * Database query logger
 */
function logQuery(query, params, duration) {
  if (process.env.LOG_QUERIES === 'true') {
    logger.debug('Database query', {
      query,
      params,
      duration: `${duration}ms`
    });
  }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byStatus: {},
        byRoute: {},
        averageResponseTime: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
  }

  recordRequest(route, status, duration) {
    this.metrics.requests.total++;
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1;
    this.metrics.requests.byRoute[route] = (this.metrics.requests.byRoute[route] || 0) + 1;

    // Update average response time
    const currentAvg = this.metrics.requests.averageResponseTime;
    const total = this.metrics.requests.total;
    this.metrics.requests.averageResponseTime = ((currentAvg * (total - 1)) + duration) / total;
  }

  recordError(errorType) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byStatus: {},
        byRoute: {},
        averageResponseTime: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring middleware
 */
function monitorPerformance(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    performanceMonitor.recordRequest(route, res.statusCode, duration);

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`
      });
    }
  });

  next();
}

/**
 * Structured logging helpers
 */
const log = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  http: (message, meta = {}) => logger.http(message, meta),

  // Specific event loggers
  auth: {
    login: (userId, success, ip) => logger.info('User login attempt', { userId, success, ip, event: 'login' }),
    register: (userId, email, ip) => logger.info('User registration', { userId, email, ip, event: 'register' }),
    logout: (userId) => logger.info('User logout', { userId, event: 'logout' }),
    passwordChange: (userId) => logger.info('Password changed', { userId, event: 'password_change' })
  },

  application: {
    created: (userId, programId, applicationId) =>
      logger.info('Application created', { userId, programId, applicationId, event: 'application_created' }),
    updated: (userId, applicationId, status) =>
      logger.info('Application updated', { userId, applicationId, status, event: 'application_updated' })
  },

  security: {
    suspiciousActivity: (ip, reason, details = {}) =>
      logger.warn('Suspicious activity detected', { ip, reason, ...details, event: 'security_alert' }),
    rateLimitExceeded: (ip, userId) =>
      logger.warn('Rate limit exceeded', { ip, userId, event: 'rate_limit' }),
    invalidToken: (ip, token) =>
      logger.warn('Invalid token attempt', { ip, token: token?.substring(0, 10), event: 'invalid_token' })
  }
};

module.exports = {
  logger,
  log,
  requestLogger,
  errorLogger,
  logQuery,
  performanceMonitor,
  monitorPerformance
};
