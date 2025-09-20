import * as fs from 'fs';
import * as path from 'path';

/**
 * Internal file logger utility for application logging
 */
export class InternalLogger {
  private logDir: string;
  private logFile: string;

  constructor(logDir = 'logs', logFileName = 'chat-events.log') {
    this.logDir = path.resolve(logDir);
    this.logFile = path.join(this.logDir, logFileName);
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log an event to the file
   * @param level Log level (info, error, warn, debug)
   * @param message Log message
   * @param data Optional data to log
   */
  log(level: 'info' | 'error' | 'warn' | 'debug', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };

    const logLine = `${timestamp} [${level.toUpperCase()}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
    
    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Log info level
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log error level
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Log warning level
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log debug level
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
}

// Export a singleton instance
export const internalLogger = new InternalLogger();
