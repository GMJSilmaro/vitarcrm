export class LoggingService {
  static LOG_PREFIX = 'upload_log_';
  static MAX_LOGS = 1000; // Maximum number of logs to keep

  static async addLog(type, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      data
    };

    // Generate unique key
    const logKey = `${this.LOG_PREFIX}${timestamp}`;
    
    try {
      // Save to localStorage
      localStorage.setItem(logKey, JSON.stringify(logEntry));
      
      // Cleanup old logs
      await this.cleanupOldLogs();
      
      return logKey;
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  static async getLogs(filter = {}) {
    const logs = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.LOG_PREFIX)) {
        try {
          const log = JSON.parse(localStorage.getItem(key));
          
          // Apply filters
          if (filter.type && log.type !== filter.type) continue;
          if (filter.startDate && new Date(log.timestamp) < new Date(filter.startDate)) continue;
          if (filter.endDate && new Date(log.timestamp) > new Date(filter.endDate)) continue;
          
          logs.push(log);
        } catch (error) {
          console.error('Error parsing log:', error);
        }
      }
    }
    
    // Sort by timestamp descending
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static async cleanupOldLogs() {
    const logs = await this.getLogs();
    if (logs.length > this.MAX_LOGS) {
      const logsToDelete = logs.slice(this.MAX_LOGS);
      logsToDelete.forEach(log => {
        const key = `${this.LOG_PREFIX}${log.timestamp}`;
        localStorage.removeItem(key);
      });
    }
  }

  static async clearLogs() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.LOG_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
} 