const os = require('os');
const { Pool } = require('pg');
const { cacheManager } = require('../middleware/cache');
const { performanceMonitor } = require('./logger');

/**
 * Real-Time Health Monitoring System
 * Provides detailed system health metrics and status
 */

class HealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.checks = new Map();
    this.metrics = {
      history: [],
      maxHistory: 100
    };
  }

  /**
   * Perform comprehensive health check
   */
  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkCPU(),
      this.checkDisk(),
      this.checkResponseTime()
    ]);

    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      checks: {},
      system: this.getSystemInfo(),
      performance: this.getPerformanceMetrics()
    };

    // Process check results
    checks.forEach((check, index) => {
      const checkNames = ['database', 'redis', 'memory', 'cpu', 'disk', 'response_time'];
      const name = checkNames[index];

      if (check.status === 'fulfilled') {
        results.checks[name] = check.value;
      } else {
        results.checks[name] = {
          status: 'unhealthy',
          error: check.reason?.message || 'Unknown error'
        };
        results.status = 'degraded';
      }
    });

    // Determine overall status
    const unhealthyChecks = Object.values(results.checks).filter(
      c => c.status === 'unhealthy'
    ).length;

    if (unhealthyChecks > 0) {
      results.status = unhealthyChecks === Object.keys(results.checks).length ? 'unhealthy' : 'degraded';
    }

    // Store in history
    this.addToHistory(results);

    return results;
  }

  /**
   * Check database connection and performance
   */
  async checkDatabase() {
    const pool = require('../config/database');
    const start = Date.now();

    try {
      // Test query
      await pool.query('SELECT 1');

      // Get connection pool stats
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };

      const responseTime = Date.now() - start;

      return {
        status: responseTime < 100 ? 'healthy' : 'degraded',
        response_time: responseTime,
        connections: poolStats,
        message: `Database responding in ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Database connection failed'
      };
    }
  }

  /**
   * Check Redis cache
   */
  async checkRedis() {
    const start = Date.now();

    try {
      if (!cacheManager.isConnected) {
        return {
          status: 'degraded',
          message: 'Redis not connected, using memory cache',
          fallback: 'memory'
        };
      }

      // Test cache operation
      const testKey = '__health_check__';
      await cacheManager.set(testKey, { test: true }, 5);
      await cacheManager.get(testKey);
      await cacheManager.delete(testKey);

      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        response_time: responseTime,
        message: `Redis responding in ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: error.message,
        message: 'Redis error, falling back to memory cache'
      };
    }
  }

  /**
   * Check memory usage
   */
  async checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const memUsagePercent = (usedMem / totalMem) * 100;
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      status: memUsagePercent > 90 ? 'unhealthy' : memUsagePercent > 80 ? 'degraded' : 'healthy',
      system: {
        total: this.formatBytes(totalMem),
        used: this.formatBytes(usedMem),
        free: this.formatBytes(freeMem),
        usage_percent: Math.round(memUsagePercent)
      },
      process: {
        rss: this.formatBytes(memUsage.rss),
        heap_total: this.formatBytes(memUsage.heapTotal),
        heap_used: this.formatBytes(memUsage.heapUsed),
        heap_usage_percent: Math.round(heapUsedPercent),
        external: this.formatBytes(memUsage.external)
      },
      message: `Memory usage at ${Math.round(memUsagePercent)}%`
    };
  }

  /**
   * Check CPU usage
   */
  async checkCPU() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const cpuUsage = process.cpuUsage();

    // Calculate CPU usage percentage
    const totalCPU = cpus.length;
    const loadAvg1Min = loadAvg[0];
    const cpuPercent = (loadAvg1Min / totalCPU) * 100;

    return {
      status: cpuPercent > 90 ? 'unhealthy' : cpuPercent > 80 ? 'degraded' : 'healthy',
      cores: totalCPU,
      model: cpus[0].model,
      speed: `${cpus[0].speed} MHz`,
      load_average: {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2)
      },
      usage_percent: Math.round(cpuPercent),
      process: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000)
      },
      message: `CPU usage at ${Math.round(cpuPercent)}%`
    };
  }

  /**
   * Check disk usage (for logs and uploads)
   */
  async checkDisk() {
    const fs = require('fs');
    const path = require('path');

    try {
      // Check logs directory
      const logsDir = path.join(__dirname, '../../logs');
      const logsSize = await this.getDirectorySize(logsDir);

      // Check uploads directory
      const uploadsDir = path.join(__dirname, '../../uploads');
      const uploadsSize = await this.getDirectorySize(uploadsDir);

      return {
        status: 'healthy',
        logs: {
          path: logsDir,
          size: this.formatBytes(logsSize)
        },
        uploads: {
          path: uploadsDir,
          size: this.formatBytes(uploadsSize)
        },
        message: 'Disk usage within normal limits'
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: error.message,
        message: 'Could not check disk usage'
      };
    }
  }

  /**
   * Check API response time
   */
  async checkResponseTime() {
    const metrics = performanceMonitor.getMetrics();

    const avgResponseTime = metrics.requests.averageResponseTime || 0;

    return {
      status: avgResponseTime > 1000 ? 'degraded' : 'healthy',
      average_response_time: Math.round(avgResponseTime),
      total_requests: metrics.requests.total,
      requests_by_status: metrics.requests.byStatus,
      errors: metrics.errors,
      message: `Average response time: ${Math.round(avgResponseTime)}ms`
    };
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      node_version: process.version,
      uptime: this.getUptime(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = performanceMonitor.getMetrics();

    return {
      requests: {
        total: metrics.requests.total,
        average_response_time: Math.round(metrics.requests.averageResponseTime),
        by_status: metrics.requests.byStatus
      },
      errors: {
        total: metrics.errors.total,
        by_type: metrics.errors.byType
      }
    };
  }

  /**
   * Get uptime in human-readable format
   */
  getUptime() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      seconds: uptimeSeconds,
      human: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  }

  /**
   * Format bytes to human-readable size
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return {
      value: parseFloat((bytes / Math.pow(k, i)).toFixed(2)),
      unit: sizes[i],
      formatted: `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
    };
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dir) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const files = await fs.readdir(dir);
      let size = 0;

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          size += await this.getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      }

      return size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Add check result to history
   */
  addToHistory(result) {
    this.metrics.history.push({
      timestamp: result.timestamp,
      status: result.status,
      checks: Object.keys(result.checks).reduce((acc, key) => {
        acc[key] = result.checks[key].status;
        return acc;
      }, {})
    });

    // Keep only last N entries
    if (this.metrics.history.length > this.metrics.maxHistory) {
      this.metrics.history.shift();
    }
  }

  /**
   * Get health history
   */
  getHistory(limit = 50) {
    return this.metrics.history.slice(-limit);
  }

  /**
   * Get health trends
   */
  getTrends() {
    const history = this.metrics.history;

    if (history.length === 0) {
      return null;
    }

    // Calculate uptime percentage
    const healthyCount = history.filter(h => h.status === 'healthy').length;
    const uptimePercent = (healthyCount / history.length) * 100;

    // Get status distribution
    const statusDistribution = history.reduce((acc, h) => {
      acc[h.status] = (acc[h.status] || 0) + 1;
      return acc;
    }, {});

    return {
      uptime_percent: Math.round(uptimePercent * 100) / 100,
      status_distribution: statusDistribution,
      total_checks: history.length,
      period: {
        from: history[0].timestamp,
        to: history[history.length - 1].timestamp
      }
    };
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

module.exports = healthMonitor;
