import { Injectable, LoggerService } from '@nestjs/common';
import { AppConfigService } from '@abms/core-config';
import pino from 'pino';

export type ContextEnricher = () => Record<string, unknown>;

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: pino.Logger;
  private readonly enrichers: ContextEnricher[] = [];

  public constructor(config: AppConfigService, loggerInstance?: pino.Logger) {
    if (loggerInstance) {
      this.logger = loggerInstance;
      return;
    }
    const { level, pretty } = config.logging;
    this.logger = pino({
      level,
      transport: pretty
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
        : undefined,
    });
  }

  public registerContextEnricher(enricher: ContextEnricher): void {
    this.enrichers.push(enricher);
  }

  public log(message: unknown, context?: string): void {
    this.logger.info(this.mergedFields(context), this.toMessage(message));
  }

  public error(message: unknown, trace?: string, context?: string): void {
    this.logger.error({ ...this.mergedFields(context), trace }, this.toMessage(message));
  }

  public warn(message: unknown, context?: string): void {
    this.logger.warn(this.mergedFields(context), this.toMessage(message));
  }

  public debug(message: unknown, context?: string): void {
    this.logger.debug(this.mergedFields(context), this.toMessage(message));
  }

  public verbose(message: unknown, context?: string): void {
    this.logger.trace(this.mergedFields(context), this.toMessage(message));
  }

  public fatal(message: unknown, context?: string): void {
    this.logger.fatal(this.mergedFields(context), this.toMessage(message));
  }

  private mergedFields(context?: string): Record<string, unknown> {
    const enriched = this.enrichers.reduce<Record<string, unknown>>(
      (acc, enrich) => ({ ...acc, ...enrich() }),
      {},
    );
    return context ? { ...enriched, context } : enriched;
  }

  private toMessage(message: unknown): string {
    return typeof message === 'string' ? message : JSON.stringify(message);
  }
}
