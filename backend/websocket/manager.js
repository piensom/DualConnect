const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { log } = require('../utils/logger');

/**
 * WebSocket Real-Time Notification System
 * Provides real-time updates for notifications, application status changes, etc.
 */

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    this.heartbeatInterval = 30000; // 30 seconds

    this.initialize();
  }

  /**
   * Initialize WebSocket server
   */
  initialize() {
    this.wss.on('connection', this.handleConnection.bind(this));

    // Start heartbeat interval
    this.startHeartbeat();

    log.info('WebSocket server initialized', { path: '/ws' });
  }

  /**
   * Verify client before accepting connection
   */
  verifyClient(info, callback) {
    const token = new URL(`http://localhost${info.req.url}`).searchParams.get('token');

    if (!token) {
      callback(false, 401, 'Unauthorized');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      callback(true);
    } catch (error) {
      log.warn('WebSocket auth failed', { error: error.message });
      callback(false, 401, 'Unauthorized');
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const userId = req.user.userId;

    // Add to clients map
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Set user info on websocket
    ws.userId = userId;
    ws.isAlive = true;

    log.info('WebSocket client connected', { userId, totalConnections: this.clients.get(userId).size });

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connected',
      message: 'Connected to Dual Connect real-time server',
      timestamp: new Date().toISOString()
    });

    // Handle messages from client
    ws.on('message', (data) => this.handleMessage(ws, data));

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle disconnection
    ws.on('close', () => this.handleDisconnection(ws));

    // Handle errors
    ws.on('error', (error) => {
      log.error('WebSocket error', { userId, error: error.message });
    });
  }

  /**
   * Handle message from client
   */
  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);

      log.debug('WebSocket message received', {
        userId: ws.userId,
        type: message.type
      });

      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;

        case 'subscribe':
          this.handleSubscribe(ws, message.channels);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(ws, message.channels);
          break;

        default:
          log.warn('Unknown WebSocket message type', { type: message.type });
      }
    } catch (error) {
      log.error('Failed to process WebSocket message', { error: error.message });
    }
  }

  /**
   * Handle subscription to channels
   */
  handleSubscribe(ws, channels) {
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }

    channels.forEach(channel => {
      ws.subscriptions.add(channel);
    });

    this.sendToClient(ws, {
      type: 'subscribed',
      channels: Array.from(ws.subscriptions),
      timestamp: new Date().toISOString()
    });

    log.info('Client subscribed to channels', {
      userId: ws.userId,
      channels: Array.from(ws.subscriptions)
    });
  }

  /**
   * Handle unsubscription from channels
   */
  handleUnsubscribe(ws, channels) {
    if (!ws.subscriptions) return;

    channels.forEach(channel => {
      ws.subscriptions.delete(channel);
    });

    this.sendToClient(ws, {
      type: 'unsubscribed',
      channels,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(ws) {
    const userId = ws.userId;

    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);

      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }

    log.info('WebSocket client disconnected', {
      userId,
      remainingConnections: this.clients.get(userId)?.size || 0
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send message to specific user (all their connections)
   */
  sendToUser(userId, data) {
    const userConnections = this.clients.get(userId);

    if (!userConnections) {
      return false;
    }

    let sent = 0;
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        sent++;
      }
    });

    return sent > 0;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data, filter = null) {
    let sent = 0;

    this.clients.forEach((connections, userId) => {
      connections.forEach(ws => {
        // Apply filter if provided
        if (filter && !filter(ws)) {
          return;
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
          sent++;
        }
      });
    });

    log.info('Broadcast message sent', { recipientCount: sent });
    return sent;
  }

  /**
   * Send to all users subscribed to a channel
   */
  sendToChannel(channel, data) {
    let sent = 0;

    this.clients.forEach((connections) => {
      connections.forEach(ws => {
        if (ws.subscriptions && ws.subscriptions.has(channel)) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
            sent++;
          }
        }
      });
    });

    return sent;
  }

  /**
   * Heartbeat to detect dead connections
   */
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          log.warn('Terminating dead WebSocket connection', { userId: ws.userId });
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.heartbeatInterval);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalClients: this.wss.clients.size,
      uniqueUsers: this.clients.size,
      connectionsByUser: Array.from(this.clients.entries()).map(([userId, connections]) => ({
        userId,
        connections: connections.size
      }))
    };
  }

  /**
   * Close all connections
   */
  close() {
    this.wss.clients.forEach((ws) => {
      ws.close();
    });
    this.wss.close();
    log.info('WebSocket server closed');
  }
}

/**
 * Notification types
 */
const NotificationTypes = {
  APPLICATION_STATUS_CHANGED: 'application.status.changed',
  NEW_MESSAGE: 'message.new',
  DEADLINE_REMINDER: 'deadline.reminder',
  NEW_PROGRAM: 'program.new',
  SYSTEM_ANNOUNCEMENT: 'system.announcement',
  USER_MENTION: 'user.mention'
};

/**
 * Helper functions for common notification patterns
 */
class NotificationHelper {
  constructor(wsManager) {
    this.wsManager = wsManager;
  }

  /**
   * Send application status change notification
   */
  notifyApplicationStatusChange(userId, application) {
    return this.wsManager.sendToUser(userId, {
      type: NotificationTypes.APPLICATION_STATUS_CHANGED,
      data: {
        applicationId: application.application_id,
        programName: application.program_name,
        oldStatus: application.old_status,
        newStatus: application.status,
        message: `Your application status has changed to ${application.status}`
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send new message notification
   */
  notifyNewMessage(userId, message) {
    return this.wsManager.sendToUser(userId, {
      type: NotificationTypes.NEW_MESSAGE,
      data: {
        messageId: message.id,
        from: message.from_name,
        subject: message.subject,
        preview: message.content.substring(0, 100)
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send deadline reminder
   */
  notifyDeadlineReminder(userId, program) {
    return this.wsManager.sendToUser(userId, {
      type: NotificationTypes.DEADLINE_REMINDER,
      data: {
        programId: program.program_id,
        programName: program.program_name,
        deadline: program.application_deadline,
        daysRemaining: this.calculateDaysRemaining(program.application_deadline)
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast new program to all users
   */
  broadcastNewProgram(program) {
    return this.wsManager.broadcast({
      type: NotificationTypes.NEW_PROGRAM,
      data: {
        programId: program.program_id,
        programName: program.program_name,
        companyName: program.company_name,
        city: program.city
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast system announcement
   */
  broadcastSystemAnnouncement(announcement) {
    return this.wsManager.broadcast({
      type: NotificationTypes.SYSTEM_ANNOUNCEMENT,
      data: {
        title: announcement.title,
        message: announcement.message,
        severity: announcement.severity || 'info'
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Calculate days remaining until deadline
   */
  calculateDaysRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

module.exports = {
  WebSocketManager,
  NotificationHelper,
  NotificationTypes
};
