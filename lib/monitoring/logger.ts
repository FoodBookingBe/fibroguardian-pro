/**
 * Geavanceerd logging systeem voor de applicatie
 * Ondersteunt verschillende log levels, filtering, en remote logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

interface LoggerOptions {
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableRemote?: boolean;
  remoteEndpoint?: string;
  includeTimestamp?: boolean;
  appVersion?: string;
  // Add a buffer size and flush interval for remote logs
  remoteBufferSize?: number;
  remoteFlushIntervalMs?: number;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string; // For errors
  appVersion?: string;
  userId?: string; // Optional user identifier
  sessionId?: string; // Session identifier
}

class Logger {
  private options: Required<LoggerOptions>; // Make options required internally
  private remoteQueue: LogEntry[] = [];
  private flushIntervalId: NodeJS.Timeout | null = null; // Changed name for clarity
  private sessionId: string;
  
  constructor(options: LoggerOptions = {}) {
    this.options = {
      minLevel: 'info',
      enableConsole: true,
      enableRemote: false,
      remoteEndpoint: '', // Default to empty string
      includeTimestamp: true,
      appVersion: 'N/A',
      remoteBufferSize: 10, // Default buffer size
      remoteFlushIntervalMs: 30000, // Default flush interval
      ...options
    };
    
    this.sessionId = typeof window !== 'undefined' ? this.getSessionId() : 'server-session';
    
    if (this.options.enableRemote && this.options.remoteEndpoint) {
      this.setupRemoteLogging();
    }
  }
  
  private getSessionId(): string {
    if (typeof sessionStorage !== 'undefined') {
      let sid = sessionStorage.getItem('loggerSessionId');
      if (!sid) {
        sid = Date.now().toString(36) + Math.random().toString(36).substring(2);
        sessionStorage.setItem('loggerSessionId', sid);
      }
      return sid;
    }
    return 'unknown-client-session';
  }
  
  private setupRemoteLogging() {
    this.flushIntervalId = setInterval(() => this.flushRemoteLogs(), this.options.remoteFlushIntervalMs);
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushRemoteLogs(true)); // Force flush on unload
    }
  }
  
  private async flushRemoteLogs(force: boolean = false) {
    if (!this.options.remoteEndpoint || this.remoteQueue.length === 0) return;
    if (!force && this.remoteQueue.length < this.options.remoteBufferSize && this.options.remoteBufferSize > 0) return;

    const logsToSend = [...this.remoteQueue]; // Copy queue
    this.remoteQueue = []; // Clear queue immediately

    try {
      const response = await fetch(this.options.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logsToSend),
        keepalive: force, // Use keepalive only when forced (e.g. beforeunload)
      });
      
      if (!response.ok) {
        // If sending fails, re-queue logs (or handle with backoff strategy)
        console.warn(`Failed to send logs to remote endpoint. Status: ${response.status}. Re-queueing ${logsToSend.length} logs.`);
        this.remoteQueue.unshift(...logsToSend); 
      }
    } catch (error) {
      console.error('Error sending logs to remote endpoint:', error);
      this.remoteQueue.unshift(...logsToSend); // Re-queue on network error
    }
  }
  
  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      appVersion: this.options.appVersion,
    };
    if (context) entry.context = context;
    // User ID could be dynamically fetched here if available globally (e.g., from auth context)
    // For simplicity, assuming it might be added to context if needed per log.
    return entry;
  }
  
  private logToConsole(entry: LogEntry) {
    if (!this.options.enableConsole) return;
    
    const consoleMethod = entry.level === 'fatal' ? 'error' : entry.level;
    const logFn = console[consoleMethod] || console.log; // Fallback to console.log
    const prefix = this.options.includeTimestamp ? `[${entry.timestamp}] ` : '';
    const styledLevel = `%c${entry.level.toUpperCase()}%c`;
    const levelColor = entry.level === 'error' || entry.level === 'fatal' ? 'color:red;' : entry.level === 'warn' ? 'color:orange;' : 'color:blue;';

    if (entry.context || entry.stack) {
      logFn(`${prefix}${styledLevel}: ${entry.message}`, levelColor, 'color:inherit;', entry.context || '', entry.stack || '');
    } else {
      logFn(`${prefix}${styledLevel}: ${entry.message}`, levelColor, 'color:inherit;');
    }
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.options.minLevel]) return;
    
    const entry = this.createLogEntry(level, message, context);
    this.logToConsole(entry);
    
    if (this.options.enableRemote && this.options.remoteEndpoint) {
      this.remoteQueue.push(entry);
      if (level === 'error' || level === 'fatal' || this.remoteQueue.length >= this.options.remoteBufferSize) {
        this.flushRemoteLogs();
      }
    }
  }
  
  public debug(message: string, context?: Record<string, any>) { this.log('debug', message, context); }
  public info(message: string, context?: Record<string, any>) { this.log('info', message, context); }
  public warn(message: string, context?: Record<string, any>) { this.log('warn', message, context); }
  
  public error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorObj = error instanceof Error ? error : (error ? new Error(String(error)) : undefined);
    const errorContext = {
      ...context,
      ...(errorObj && { name: errorObj.name, message: errorObj.message, stack: errorObj.stack })
    };
    this.log('error', message, errorContext);
  }
  
  public fatal(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorObj = error instanceof Error ? error : (error ? new Error(String(error)) : undefined);
    const errorContext = {
      ...context,
      ...(errorObj && { name: errorObj.name, message: errorObj.message, stack: errorObj.stack })
    };
    this.log('fatal', message, errorContext);
  }
  
  public dispose() {
    if (this.flushIntervalId) clearInterval(this.flushIntervalId);
    this.flushRemoteLogs(true); // Final flush on dispose
  }
}

// Singleton instance
// Ensure environment variables are correctly accessed (process.env might not be available client-side directly for all vars)
// For client-side, NEXT_PUBLIC_ prefixed vars are available.
const appVersion = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_APP_VERSION : undefined;
const logEndpoint = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_LOG_ENDPOINT : undefined;
const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : 'production';


export const logger = new Logger({
  minLevel: nodeEnv === 'production' ? 'info' : 'debug',
  enableConsole: true, // Always enable console for dev, can be configured for prod
  enableRemote: nodeEnv === 'production' && !!logEndpoint,
  remoteEndpoint: logEndpoint,
  appVersion: appVersion || '0.1.0-local', // Fallback version
});

// Global error handlers (client-side only)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event: ErrorEvent) => {
    logger.error(event.message, event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.error('Unhandled promise rejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  });
}