// Admin Activity Audit Logger

const fs = require('fs').promises;
const path = require('path');

class AuditLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.currentLogFile = path.join(this.logsDir, `audit-${this.getDateString()}.log`);
    this.initialize();
  }

  /**
   * Initialize logs directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
      console.log('✅ Audit logger initialized');
    } catch (error) {
      console.error('Error initializing audit logger:', error);
    }
  }

  /**
   * Get date string for log file name
   */
  getDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * Log an admin action
   */
  async log(action, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      adminId: details.adminId || null,
      adminEmail: details.adminEmail || null,
      targetType: details.targetType || null, // 'program', 'user', 'application', etc.
      targetId: details.targetId || null,
      changes: details.changes || null,
      ipAddress: details.ipAddress || null,
      userAgent: details.userAgent || null,
      status: details.status || 'success',
      errorMessage: details.errorMessage || null
    };

    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.currentLogFile, logLine);

      // Also store in database if pool is available
      if (details.db) {
        await this.storeInDatabase(logEntry, details.db);
      }

      return logEntry;
    } catch (error) {
      console.error('Error writing audit log:', error);
      throw error;
    }
  }

  /**
   * Store audit log in database
   */
  async storeInDatabase(logEntry, db) {
    try {
      const query = `
        INSERT INTO audit_logs (
          timestamp, action, admin_id, admin_email, target_type,
          target_id, changes, ip_address, user_agent, status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const values = [
        logEntry.timestamp,
        logEntry.action,
        logEntry.adminId,
        logEntry.adminEmail,
        logEntry.targetType,
        logEntry.targetId,
        JSON.stringify(logEntry.changes),
        logEntry.ipAddress,
        logEntry.userAgent,
        logEntry.status,
        logEntry.errorMessage
      ];

      await db.query(query, values);
    } catch (error) {
      // If audit_logs table doesn't exist, just log to file
      console.warn('Could not store audit log in database:', error.message);
    }
  }

  /**
   * Log program creation
   */
  async logProgramCreated(adminId, adminEmail, programId, programData, req) {
    return await this.log('PROGRAM_CREATED', {
      adminId,
      adminEmail,
      targetType: 'program',
      targetId: programId,
      changes: { created: programData },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log program update
   */
  async logProgramUpdated(adminId, adminEmail, programId, oldData, newData, req) {
    return await this.log('PROGRAM_UPDATED', {
      adminId,
      adminEmail,
      targetType: 'program',
      targetId: programId,
      changes: { old: oldData, new: newData },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log program deletion
   */
  async logProgramDeleted(adminId, adminEmail, programId, programData, req) {
    return await this.log('PROGRAM_DELETED', {
      adminId,
      adminEmail,
      targetType: 'program',
      targetId: programId,
      changes: { deleted: programData },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log application status change
   */
  async logApplicationStatusChanged(adminId, adminEmail, applicationId, oldStatus, newStatus, req) {
    return await this.log('APPLICATION_STATUS_CHANGED', {
      adminId,
      adminEmail,
      targetType: 'application',
      targetId: applicationId,
      changes: { oldStatus, newStatus },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log bulk application status change
   */
  async logBulkApplicationStatusChanged(adminId, adminEmail, applicationIds, newStatus, req) {
    return await this.log('BULK_APPLICATION_STATUS_CHANGED', {
      adminId,
      adminEmail,
      targetType: 'application',
      targetId: applicationIds.join(','),
      changes: { count: applicationIds.length, newStatus },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log user creation
   */
  async logUserCreated(adminId, adminEmail, userId, userData, req) {
    return await this.log('USER_CREATED', {
      adminId,
      adminEmail,
      targetType: 'user',
      targetId: userId,
      changes: { created: { email: userData.email, role: userData.role } },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log user deletion
   */
  async logUserDeleted(adminId, adminEmail, userId, userData, req) {
    return await this.log('USER_DELETED', {
      adminId,
      adminEmail,
      targetType: 'user',
      targetId: userId,
      changes: { deleted: { email: userData.email } },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log admin login
   */
  async logAdminLogin(adminId, adminEmail, req, success = true) {
    return await this.log('ADMIN_LOGIN', {
      adminId,
      adminEmail,
      targetType: 'admin',
      targetId: adminId,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent'),
      status: success ? 'success' : 'failed'
    });
  }

  /**
   * Log admin logout
   */
  async logAdminLogout(adminId, adminEmail, req) {
    return await this.log('ADMIN_LOGOUT', {
      adminId,
      adminEmail,
      targetType: 'admin',
      targetId: adminId,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Log settings change
   */
  async logSettingsChanged(adminId, adminEmail, settingKey, oldValue, newValue, req) {
    return await this.log('SETTINGS_CHANGED', {
      adminId,
      adminEmail,
      targetType: 'settings',
      targetId: settingKey,
      changes: { old: oldValue, new: newValue },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  /**
   * Get audit logs for a specific date
   */
  async getLogsByDate(date) {
    try {
      const logFile = path.join(this.logsDir, `audit-${date}.log`);
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.trim().split('\n');

      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error(`Error reading logs for date ${date}:`, error);
      return [];
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(limit = 100) {
    try {
      const content = await fs.readFile(this.currentLogFile, 'utf-8');
      const lines = content.trim().split('\n');
      const recentLines = lines.slice(-limit);

      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('Error reading recent logs:', error);
      return [];
    }
  }

  /**
   * Get logs by admin
   */
  async getLogsByAdmin(adminId, limit = 50) {
    const logs = await this.getRecentLogs(1000);
    return logs
      .filter(log => log.adminId === adminId)
      .slice(-limit);
  }

  /**
   * Get logs by action type
   */
  async getLogsByAction(action, limit = 50) {
    const logs = await this.getRecentLogs(1000);
    return logs
      .filter(log => log.action === action)
      .slice(-limit);
  }

  /**
   * Search logs
   */
  async searchLogs(searchTerm, limit = 100) {
    const logs = await this.getRecentLogs(1000);
    const term = searchTerm.toLowerCase();

    return logs
      .filter(log => {
        const logString = JSON.stringify(log).toLowerCase();
        return logString.includes(term);
      })
      .slice(-limit);
  }
}

module.exports = new AuditLogger();
