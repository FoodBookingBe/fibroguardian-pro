// Basic placeholder logger
// In a real app, this would integrate with a proper logging service (Sentry, Logtail, etc.)

interface LogData {
  [key: string]: unknown;
}

const formatLog = (level: string, message: string, data?: LogData) => {
  const timestamp = new Date().toISOString();
  let logString = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (data && Object.keys(data).length > 0) {
    try {
      logString += ` | Data: ${JSON.stringify(data)}`;
    } catch (e) {
      // Fallback if data cannot be stringified
      logString += ` | Data: (Unserializable)`;
    }
  }
  return logString;
};

export const logger = {
  info: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog('info', message, data));
    }
    // TODO: Send to remote logging service in production
  },
  warn: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(formatLog('warn', message, data));
    }
    // TODO: Send to remote logging service in production
  },
  error: (message: string, error?: Error | any, data?: LogData) => {
    const errorInfo = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error_details: error };
    const combinedData = { ...data, ...errorInfo };
    if (process.env.NODE_ENV === 'development') {
      console.error(formatLog('error', message, combinedData));
    }
    // TODO: Send to remote logging service in production
  },
  debug: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') { // Only log debug in development
      console.debug(formatLog('debug', message, data));
    }
  }
};

// Example usage:
// logger.info('User logged in', { userId: '123' });
// logger.error('Failed to fetch data', new Error('Network timeout'), { endpoint: '/api/data' });
