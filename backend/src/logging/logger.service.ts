import { Injectable, LoggerService } from '@nestjs/common';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMetadata = Record<string, unknown>;

type PinoLikeLogger = {
  debug(payload: Record<string, unknown>, message?: string): void;
  info(payload: Record<string, unknown>, message?: string): void;
  warn(payload: Record<string, unknown>, message?: string): void;
  error(payload: Record<string, unknown>, message?: string): void;
  child(bindings: Record<string, unknown>): PinoLikeLogger;
};

const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'refreshTokenHash',
  'authorization',
  'cookie',
]);

@Injectable()
export class AppLogger implements LoggerService {
  private logger: PinoLikeLogger;
  private context?: string;

  constructor() {
    this.logger = this.createRootLogger();
  }

  withContext(context: string): AppLogger {
    return AppLogger.fromChildLogger(context, this.logger);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    const { messageText, metadata } = this.normalize(message, optionalParams);
    this.write('info', messageText, metadata);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const { messageText, metadata } = this.normalize(message, optionalParams);
    this.write('error', messageText, metadata);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    const { messageText, metadata } = this.normalize(message, optionalParams);
    this.write('warn', messageText, metadata);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    const { messageText, metadata } = this.normalize(message, optionalParams);
    this.write('debug', messageText, metadata);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    const { messageText, metadata } = this.normalize(message, optionalParams);
    this.write('debug', messageText, metadata);
  }

  private write(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const payload = this.sanitize(metadata ?? {}) as Record<string, unknown>;
    this.logger[level](payload, message);
  }

  private normalize(
    message: unknown,
    optionalParams: unknown[],
  ): { messageText: string; metadata?: LogMetadata } {
    const [firstParam] = optionalParams;
    const metadata =
      this.isRecord(firstParam)
        ? firstParam
        : firstParam instanceof Error
          ? {
              errorName: firstParam.name,
              stack: firstParam.stack,
            }
          : undefined;

    return {
      messageText: this.toMessage(message),
      metadata,
    };
  }

  private createRootLogger(): PinoLikeLogger {
    try {
      const pinoFactory = require('pino');
      return pinoFactory({
        level: process.env.LOG_LEVEL ?? 'info',
        base: undefined,
        redact: {
          paths: [
            '*.password',
            '*.passwordHash',
            '*.accessToken',
            '*.refreshToken',
            '*.refreshTokenHash',
            '*.authorization',
            '*.cookie',
          ],
          censor: '[REDACTED]',
        },
      });
    } catch {
      return this.createFallbackLogger();
    }
  }

  private createFallbackLogger(): PinoLikeLogger {
    const write = (level: LogLevel, payload: Record<string, unknown>, message?: string) => {
      const line = JSON.stringify({
        level,
        message,
        ...payload,
      });
      if (level === 'error') {
        process.stderr.write(`${line}\n`);
        return;
      }
      process.stdout.write(`${line}\n`);
    };

    return {
      debug: (payload, message) => write('debug', payload, message),
      info: (payload, message) => write('info', payload, message),
      warn: (payload, message) => write('warn', payload, message),
      error: (payload, message) => write('error', payload, message),
      child: (bindings) => ({
        debug: (payload, message) => write('debug', { ...bindings, ...payload }, message),
        info: (payload, message) => write('info', { ...bindings, ...payload }, message),
        warn: (payload, message) => write('warn', { ...bindings, ...payload }, message),
        error: (payload, message) => write('error', { ...bindings, ...payload }, message),
        child: (childBindings) =>
          this.createFallbackLogger().child({ ...bindings, ...childBindings }),
      }),
    };
  }

  private sanitize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (!this.isRecord(value)) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        REDACTED_KEYS.has(key) ? '[REDACTED]' : this.sanitize(nestedValue),
      ]),
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toMessage(message: unknown): string {
    if (message instanceof Error) {
      return message.message;
    }
    if (typeof message === 'string') {
      return message;
    }
    return JSON.stringify(this.sanitize(message));
  }

  private static fromChildLogger(
    context: string,
    parentLogger: PinoLikeLogger,
  ): AppLogger {
    const logger = Object.create(AppLogger.prototype) as AppLogger;
    logger.context = context;
    logger.logger = parentLogger.child({ context });
    return logger;
  }
}
