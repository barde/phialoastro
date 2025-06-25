/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  minLevel: LogLevel;
  prefix?: string;
  includeTimestamp?: boolean;
}

/**
 * Structured logger for Cloudflare Workers
 */
class Logger {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: LogLevel.INFO,
      includeTimestamp: true,
      ...config,
    };
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.minLevel];
  }

  /**
   * Format log entry
   */
  private formatEntry(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    parts.push(`[${entry.level}]`);
    parts.push(entry.message);

    if (entry.data) {
      parts.push(JSON.stringify(entry.data, null, 2));
    }

    return parts.join(' ');
  }

  /**
   * Log a message
   */
  public log(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
      default:
        console.log(formatted);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Create a child logger with additional context
   */
  child(prefix: string): Logger {
    const childPrefix = this.config.prefix
      ? `${this.config.prefix}:${prefix}`
      : prefix;

    return new Logger({
      ...this.config,
      prefix: childPrefix,
    });
  }

  /**
   * Update logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  prefix: 'phialo-worker',
});

/**
 * Request logger middleware
 */
export function logRequest(request: Request): void {
  const url = new URL(request.url);
  
  logger.info('Incoming request', {
    method: request.method,
    path: url.pathname,
    query: url.search,
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'accept': request.headers.get('accept'),
      'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
    },
  });
}

/**
 * Response logger
 */
export function logResponse(request: Request, response: Response, duration: number): void {
  const url = new URL(request.url);
  const level = response.status >= 400 ? LogLevel.WARN : LogLevel.INFO;

  logger.log(level, 'Request completed', {
    method: request.method,
    path: url.pathname,
    status: response.status,
    duration: `${duration}ms`,
    cacheStatus: response.headers.get('cf-cache-status'),
  });
}