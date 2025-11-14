const crypto = require('crypto');
const axios = require('axios');
const pool = require('../config/database');
const { log } = require('../utils/logger');

/**
 * Webhook Management System
 * Allows external systems to receive real-time event notifications
 */

class WebhookManager {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = [1000, 5000, 15000]; // Exponential backoff
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(userId, config) {
    const { url, events, description, secret } = config;

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid webhook URL');
    }

    // Generate secret if not provided
    const webhookSecret = secret || this.generateSecret();

    // Insert webhook
    const result = await pool.query(
      `INSERT INTO webhooks (user_id, url, events, description, secret, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING webhook_id, url, events, description, created_at`,
      [userId, url, JSON.stringify(events), description, webhookSecret]
    );

    const webhook = result.rows[0];

    log.info('Webhook registered', {
      webhookId: webhook.webhook_id,
      userId,
      url,
      events
    });

    return {
      ...webhook,
      secret: webhookSecret
    };
  }

  /**
   * Update existing webhook
   */
  async updateWebhook(webhookId, userId, updates) {
    const { url, events, description, is_active } = updates;

    const result = await pool.query(
      `UPDATE webhooks
       SET url = COALESCE($1, url),
           events = COALESCE($2, events),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE webhook_id = $5 AND user_id = $6
       RETURNING *`,
      [
        url,
        events ? JSON.stringify(events) : null,
        description,
        is_active,
        webhookId,
        userId
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Webhook not found');
    }

    log.info('Webhook updated', { webhookId, userId });

    return result.rows[0];
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId, userId) {
    const result = await pool.query(
      'DELETE FROM webhooks WHERE webhook_id = $1 AND user_id = $2 RETURNING webhook_id',
      [webhookId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Webhook not found');
    }

    log.info('Webhook deleted', { webhookId, userId });

    return { success: true };
  }

  /**
   * Get all webhooks for a user
   */
  async getUserWebhooks(userId) {
    const result = await pool.query(
      `SELECT webhook_id, url, events, description, is_active, created_at, updated_at,
              (SELECT COUNT(*) FROM webhook_deliveries WHERE webhook_id = webhooks.webhook_id) as delivery_count,
              (SELECT COUNT(*) FROM webhook_deliveries WHERE webhook_id = webhooks.webhook_id AND status = 'failed') as failed_count
       FROM webhooks
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(eventType, data, options = {}) {
    const { userId, metadata = {} } = options;

    // Get all webhooks subscribed to this event
    let query = `
      SELECT webhook_id, user_id, url, secret, events
      FROM webhooks
      WHERE is_active = true
      AND events::jsonb ? $1
    `;

    const params = [eventType];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);

    const webhooks = result.rows;

    log.info('Triggering webhook event', {
      eventType,
      webhookCount: webhooks.length
    });

    // Trigger all webhooks asynchronously
    const deliveries = await Promise.allSettled(
      webhooks.map(webhook => this.deliverWebhook(webhook, eventType, data, metadata))
    );

    return {
      eventType,
      triggered: webhooks.length,
      successful: deliveries.filter(d => d.status === 'fulfilled').length,
      failed: deliveries.filter(d => d.status === 'rejected').length
    };
  }

  /**
   * Deliver webhook to endpoint
   */
  async deliverWebhook(webhook, eventType, data, metadata = {}) {
    const payload = {
      event: eventType,
      data,
      metadata: {
        ...metadata,
        webhook_id: webhook.webhook_id,
        delivered_at: new Date().toISOString()
      }
    };

    const signature = this.generateSignature(payload, webhook.secret);

    let attempt = 0;
    let lastError = null;

    // Retry logic
    while (attempt < this.retryAttempts) {
      try {
        const response = await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': eventType,
            'X-Webhook-Delivery-ID': crypto.randomUUID(),
            'User-Agent': 'DualConnect-Webhooks/1.0'
          },
          timeout: this.timeout
        });

        // Log successful delivery
        await this.logDelivery(webhook.webhook_id, eventType, payload, 'success', {
          statusCode: response.status,
          attempt: attempt + 1,
          responseTime: Date.now()
        });

        log.info('Webhook delivered successfully', {
          webhookId: webhook.webhook_id,
          eventType,
          attempt: attempt + 1
        });

        return {
          success: true,
          webhookId: webhook.webhook_id,
          attempt: attempt + 1
        };

      } catch (error) {
        lastError = error;
        attempt++;

        log.warn('Webhook delivery failed', {
          webhookId: webhook.webhook_id,
          eventType,
          attempt,
          error: error.message
        });

        // Wait before retry
        if (attempt < this.retryAttempts) {
          await this.sleep(this.retryDelay[attempt - 1]);
        }
      }
    }

    // Log failed delivery
    await this.logDelivery(webhook.webhook_id, eventType, payload, 'failed', {
      error: lastError?.message,
      attempts: this.retryAttempts
    });

    throw new Error(`Webhook delivery failed after ${this.retryAttempts} attempts`);
  }

  /**
   * Log webhook delivery
   */
  async logDelivery(webhookId, eventType, payload, status, metadata = {}) {
    await pool.query(
      `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status, metadata, delivered_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        webhookId,
        eventType,
        JSON.stringify(payload),
        status,
        JSON.stringify(metadata)
      ]
    );
  }

  /**
   * Get webhook deliveries
   */
  async getDeliveries(webhookId, limit = 50) {
    const result = await pool.query(
      `SELECT delivery_id, event_type, status, metadata, delivered_at
       FROM webhook_deliveries
       WHERE webhook_id = $1
       ORDER BY delivered_at DESC
       LIMIT $2`,
      [webhookId, limit]
    );

    return result.rows;
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId, userId) {
    const result = await pool.query(
      'SELECT * FROM webhooks WHERE webhook_id = $1 AND user_id = $2',
      [webhookId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Webhook not found');
    }

    const webhook = result.rows[0];

    const testPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString()
      },
      metadata: {
        webhook_id: webhookId,
        test: true
      }
    };

    const signature = this.generateSignature(testPayload, webhook.secret);

    try {
      const response = await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
          'User-Agent': 'DualConnect-Webhooks/1.0'
        },
        timeout: this.timeout
      });

      await this.logDelivery(webhookId, 'webhook.test', testPayload, 'success', {
        statusCode: response.status,
        test: true
      });

      return {
        success: true,
        statusCode: response.status,
        message: 'Test webhook delivered successfully'
      };

    } catch (error) {
      await this.logDelivery(webhookId, 'webhook.test', testPayload, 'failed', {
        error: error.message,
        test: true
      });

      throw new Error(`Test webhook failed: ${error.message}`);
    }
  }

  /**
   * Generate webhook signature for verification
   */
  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return 'sha256=' + hmac.digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate random secret
   */
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate URL
   */
  isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize webhook tables
   */
  async initializeTables() {
    const createWebhooksTable = `
      CREATE TABLE IF NOT EXISTS webhooks (
        webhook_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        events JSONB NOT NULL,
        description TEXT,
        secret VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createDeliveriesTable = `
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        delivery_id SERIAL PRIMARY KEY,
        webhook_id INTEGER NOT NULL REFERENCES webhooks(webhook_id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) NOT NULL,
        metadata JSONB,
        delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
      CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
    `;

    try {
      await pool.query(createWebhooksTable);
      await pool.query(createDeliveriesTable);
      await pool.query(createIndexes);
      log.info('Webhook tables initialized');
    } catch (error) {
      log.error('Failed to initialize webhook tables', { error: error.message });
      throw error;
    }
  }
}

/**
 * Webhook event types
 */
const WebhookEvents = {
  APPLICATION_CREATED: 'application.created',
  APPLICATION_UPDATED: 'application.updated',
  APPLICATION_STATUS_CHANGED: 'application.status.changed',
  PROGRAM_CREATED: 'program.created',
  PROGRAM_UPDATED: 'program.updated',
  USER_REGISTERED: 'user.registered',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  BOOKMARK_ADDED: 'bookmark.added',
  BOOKMARK_REMOVED: 'bookmark.removed'
};

// Create singleton instance
const webhookManager = new WebhookManager();

module.exports = {
  webhookManager,
  WebhookEvents
};
