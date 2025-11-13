const Queue = require('bull');
const { log } = require('../utils/logger');

/**
 * Job Queue System using Bull
 * Handles background jobs like email sending, report generation, etc.
 */

// Queue configurations
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500 // Keep last 500 failed jobs
  }
};

// Create queues
const emailQueue = new Queue('email', queueConfig);
const reportQueue = new Queue('reports', queueConfig);
const notificationQueue = new Queue('notifications', queueConfig);
const cleanupQueue = new Queue('cleanup', queueConfig);

/**
 * Email Queue Processor
 */
emailQueue.process(async (job) => {
  const { type, data } = job.data;
  log.info('Processing email job', { type, jobId: job.id });

  const emailService = require('../services/emailService');

  try {
    switch (type) {
      case 'welcome':
        await emailService.sendWelcomeEmail(data.user);
        break;

      case 'application-status':
        await emailService.sendApplicationStatusEmail(data.application, data.user);
        break;

      case 'password-reset':
        await emailService.sendPasswordResetEmail(data.user, data.resetToken);
        break;

      case 'deadline-reminder':
        await emailService.sendDeadlineReminder(data.user, data.program);
        break;

      case 'weekly-digest':
        await emailService.sendWeeklyDigest(data.user, data.stats);
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    log.info('Email sent successfully', { type, jobId: job.id });
    return { success: true, type };
  } catch (error) {
    log.error('Email job failed', { type, jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Report Queue Processor
 */
reportQueue.process(async (job) => {
  const { type, userId, filters } = job.data;
  log.info('Processing report job', { type, userId, jobId: job.id });

  try {
    let reportData;

    switch (type) {
      case 'application-export':
        reportData = await generateApplicationReport(userId, filters);
        break;

      case 'analytics-export':
        reportData = await generateAnalyticsReport(userId, filters);
        break;

      case 'user-activity':
        reportData = await generateUserActivityReport(userId, filters);
        break;

      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    log.info('Report generated successfully', { type, userId, jobId: job.id });
    return { success: true, reportData };
  } catch (error) {
    log.error('Report job failed', { type, userId, jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Notification Queue Processor
 */
notificationQueue.process(async (job) => {
  const { type, userId, data } = job.data;
  log.info('Processing notification job', { type, userId, jobId: job.id });

  const pool = require('../config/database');

  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, data.title, data.message, JSON.stringify(data.metadata || {})]
    );

    log.info('Notification created successfully', { type, userId, jobId: job.id });
    return { success: true };
  } catch (error) {
    log.error('Notification job failed', { type, userId, jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Cleanup Queue Processor
 */
cleanupQueue.process(async (job) => {
  const { type } = job.data;
  log.info('Processing cleanup job', { type, jobId: job.id });

  const pool = require('../config/database');

  try {
    let result;

    switch (type) {
      case 'old-notifications':
        // Delete read notifications older than 30 days
        result = await pool.query(
          `DELETE FROM notifications
           WHERE is_read = TRUE
           AND created_at < NOW() - INTERVAL '30 days'`
        );
        log.info('Deleted old notifications', { count: result.rowCount });
        break;

      case 'expired-tokens':
        // Clean up expired refresh tokens
        const { DatabaseRefreshTokenStore } = require('../middleware/refreshToken');
        const store = new DatabaseRefreshTokenStore();
        const count = await store.cleanupExpired();
        log.info('Deleted expired refresh tokens', { count });
        break;

      case 'temp-files':
        // Clean up temporary upload files older than 24 hours
        const fs = require('fs').promises;
        const path = require('path');
        const uploadDir = process.env.UPLOAD_DIR || './uploads/temp';
        const files = await fs.readdir(uploadDir);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
          const filePath = path.join(uploadDir, file);
          const stats = await fs.stat(filePath);
          const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

          if (ageHours > 24) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }

        log.info('Deleted temporary files', { count: deletedCount });
        break;

      default:
        throw new Error(`Unknown cleanup type: ${type}`);
    }

    return { success: true, type };
  } catch (error) {
    log.error('Cleanup job failed', { type, jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Helper functions for report generation
 */
async function generateApplicationReport(userId, filters) {
  const pool = require('../config/database');
  // Implementation here
  return { format: 'csv', data: [] };
}

async function generateAnalyticsReport(userId, filters) {
  // Implementation here
  return { format: 'pdf', data: [] };
}

async function generateUserActivityReport(userId, filters) {
  // Implementation here
  return { format: 'json', data: [] };
}

/**
 * Queue Event Handlers
 */
const queues = [emailQueue, reportQueue, notificationQueue, cleanupQueue];

queues.forEach(queue => {
  queue.on('completed', (job, result) => {
    log.info('Job completed', {
      queue: queue.name,
      jobId: job.id,
      duration: Date.now() - job.timestamp
    });
  });

  queue.on('failed', (job, error) => {
    log.error('Job failed', {
      queue: queue.name,
      jobId: job.id,
      error: error.message,
      attempts: job.attemptsMade
    });
  });

  queue.on('stalled', (job) => {
    log.warn('Job stalled', {
      queue: queue.name,
      jobId: job.id
    });
  });

  queue.on('error', (error) => {
    log.error('Queue error', {
      queue: queue.name,
      error: error.message
    });
  });
});

/**
 * Schedule recurring jobs
 */
function scheduleRecurringJobs() {
  // Send weekly digests every Sunday at 9 AM
  emailQueue.add(
    'weekly-digest-batch',
    { type: 'batch-weekly-digest' },
    {
      repeat: {
        cron: '0 9 * * 0' // Every Sunday at 9 AM
      }
    }
  );

  // Cleanup old notifications daily at 2 AM
  cleanupQueue.add(
    'cleanup-notifications',
    { type: 'old-notifications' },
    {
      repeat: {
        cron: '0 2 * * *' // Every day at 2 AM
      }
    }
  );

  // Cleanup expired tokens every 6 hours
  cleanupQueue.add(
    'cleanup-tokens',
    { type: 'expired-tokens' },
    {
      repeat: {
        cron: '0 */6 * * *' // Every 6 hours
      }
    }
  );

  // Cleanup temp files daily at 3 AM
  cleanupQueue.add(
    'cleanup-temp-files',
    { type: 'temp-files' },
    {
      repeat: {
        cron: '0 3 * * *' // Every day at 3 AM
      }
    }
  );

  log.info('Recurring jobs scheduled');
}

// Initialize recurring jobs
if (process.env.ENABLE_SCHEDULED_JOBS !== 'false') {
  scheduleRecurringJobs();
}

/**
 * API for adding jobs to queues
 */
const JobQueue = {
  // Email jobs
  async sendEmail(type, data, options = {}) {
    return await emailQueue.add({ type, data }, options);
  },

  // Report jobs
  async generateReport(type, userId, filters, options = {}) {
    return await reportQueue.add({ type, userId, filters }, options);
  },

  // Notification jobs
  async createNotification(userId, type, data, options = {}) {
    return await notificationQueue.add({ type, userId, data }, options);
  },

  // Cleanup jobs
  async scheduleCleanup(type, options = {}) {
    return await cleanupQueue.add({ type }, options);
  },

  // Queue statistics
  async getStats() {
    const stats = {};

    for (const queue of queues) {
      const counts = await queue.getJobCounts();
      stats[queue.name] = {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        paused: counts.paused
      };
    }

    return stats;
  },

  // Get job status
  async getJobStatus(queue, jobId) {
    let targetQueue;
    switch (queue) {
      case 'email':
        targetQueue = emailQueue;
        break;
      case 'reports':
        targetQueue = reportQueue;
        break;
      case 'notifications':
        targetQueue = notificationQueue;
        break;
      case 'cleanup':
        targetQueue = cleanupQueue;
        break;
      default:
        throw new Error('Invalid queue name');
    }

    const job = await targetQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: await job.progress(),
      state: await job.getState(),
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn
    };
  }
};

module.exports = JobQueue;
