const redis = require('redis');
const { promisify } = require('util');

/**
 * Redis Cache Manager
 * Provides caching functionality with Redis
 */
class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map(); // Fallback to memory cache if Redis unavailable
    this.defaultTTL = 300; // 5 minutes default
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.warn('⚠ Redis connection refused, using memory cache');
            return undefined; // Stop retrying
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return undefined; // Stop after 1 hour
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('✓ Redis cache connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.warn('⚠ Redis error:', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.warn('⚠ Redis connection closed, using memory cache');
        this.isConnected = false;
      });

      // Promisify Redis methods
      if (this.client) {
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.setex).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
        this.flushAsync = promisify(this.client.flushdb).bind(this.client);
      }
    } catch (error) {
      console.warn('⚠ Redis not available, using memory cache:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const value = await this.getAsync(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Fallback to memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.isConnected && this.client) {
        await this.setAsync(key, ttl, JSON.stringify(value));
      } else {
        // Fallback to memory cache
        this.memoryCache.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });
        // Limit memory cache size
        if (this.memoryCache.size > 1000) {
          const firstKey = this.memoryCache.keys().next().value;
          this.memoryCache.delete(firstKey);
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      if (this.isConnected && this.client) {
        await this.delAsync(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern) {
    try {
      if (this.isConnected && this.client) {
        const keys = await promisify(this.client.keys).bind(this.client)(pattern);
        if (keys.length > 0) {
          await this.delAsync(...keys);
        }
      } else {
        // For memory cache, delete matching keys
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    try {
      if (this.isConnected && this.client) {
        await this.flushAsync();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      this.client.quit();
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Express middleware for caching responses
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'api',
    skipCache = () => false,
    includeQuery = true,
    includeUser = false
  } = options;

  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching should be skipped
    if (skipCache(req)) {
      return next();
    }

    // Generate cache key
    let cacheKey = `${keyPrefix}:${req.path}`;
    if (includeQuery && Object.keys(req.query).length > 0) {
      const sortedQuery = Object.keys(req.query).sort().reduce((acc, key) => {
        acc[key] = req.query[key];
        return acc;
      }, {});
      cacheKey += ':' + JSON.stringify(sortedQuery);
    }
    if (includeUser && req.user) {
      cacheKey += `:user:${req.user.user_id}`;
    }

    // Try to get from cache
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response
      cacheManager.set(cacheKey, data, ttl).catch(err =>
        console.error('Failed to cache response:', err)
      );
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache invalidation helper
 */
async function invalidateCache(pattern) {
  await cacheManager.deletePattern(pattern);
}

module.exports = {
  cacheManager,
  cacheMiddleware,
  invalidateCache
};
