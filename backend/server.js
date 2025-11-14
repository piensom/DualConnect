const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import custom middleware
const { sanitizeInputs, getCSRFToken } = require('./middleware/security');
const { cacheManager } = require('./middleware/cache');
const { logger, log, requestLogger, errorLogger, monitorPerformance } = require('./utils/logger');

// Initialize cache connection
cacheManager.connect().catch(err => {
  log.warn('Cache initialization failed, continuing without cache', { error: err.message });
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging and performance monitoring
app.use(requestLogger);
app.use(monitorPerformance);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS protection - sanitize inputs
app.use(sanitizeInputs);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// CSRF token endpoint
app.get('/api/csrf-token', getCSRFToken);

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database connection
  try {
    const pool = require('./config/database');
    await pool.query('SELECT 1');
    healthcheck.database = 'connected';
  } catch (error) {
    healthcheck.database = 'disconnected';
    healthcheck.status = 'degraded';
  }

  // Check cache connection
  healthcheck.cache = cacheManager.isConnected ? 'connected' : 'disconnected';

  res.status(healthcheck.status === 'ok' ? 200 : 503).json(healthcheck);
});

// Performance metrics endpoint (for monitoring)
app.get('/api/metrics', (req, res) => {
  const { performanceMonitor } = require('./utils/logger');
  res.json(performanceMonitor.getMetrics());
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/funding', require('./routes/funding'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/faq', require('./routes/faq'));
app.use('/api/glossary', require('./routes/glossary'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handling middleware
app.use(errorLogger);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  // Log error with context
  log.error('Request error', {
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(status).json({
    error: {
      message: process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal server error'
        : message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  log.warn('Route not found', { method: req.method, url: req.url, ip: req.ip });
  res.status(404).json({ error: { message: 'Route not found', status: 404 } });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  log.info(`${signal} received, shutting down gracefully`);

  server.close(async () => {
    log.info('HTTP server closed');

    // Close database connections
    try {
      const pool = require('./config/database');
      await pool.end();
      log.info('Database connections closed');
    } catch (error) {
      log.error('Error closing database', { error: error.message });
    }

    // Close cache connections
    try {
      await cacheManager.close();
      log.info('Cache connections closed');
    } catch (error) {
      log.error('Error closing cache', { error: error.message });
    }

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection', { reason, promise });
});

// Start server
const server = app.listen(PORT, () => {
  log.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ API available at http://localhost:${PORT}/api`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
