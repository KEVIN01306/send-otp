export class Logger {
  private static sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(Logger.sanitize);

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = [
      'rawapikey',
      'apikey',
      'key',
      'otp',
      'code',
      'password',
      'adminmasterkey',
      'resendapikey',
      'token',
      'secret',
      'authorization',
      'x-api-key',
      'x-admin-key',
    ];

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = Logger.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  public static info(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const meta = context ? ` ${JSON.stringify(Logger.sanitize(context))}` : '';
    console.log(`[${timestamp}] [INFO] ${message}${meta}`);
  }

  public static warn(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const meta = context ? ` ${JSON.stringify(Logger.sanitize(context))}` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${meta}`);
  }

  public static error(message: string, error?: any, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const meta = context ? ` ${JSON.stringify(Logger.sanitize(context))}` : '';
    const errMessage = error instanceof Error ? error.message : error ? String(error) : '';
    console.error(`[${timestamp}] [ERROR] ${message}${errMessage ? ` - ${errMessage}` : ''}${meta}`);
  }
}
