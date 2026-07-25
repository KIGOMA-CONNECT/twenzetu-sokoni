import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.APP_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.APP_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    });
  }

  public log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  public error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  public warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  public debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  public verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }
}
