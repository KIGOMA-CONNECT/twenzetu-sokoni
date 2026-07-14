import { createApiErrorResponse } from '@abms/core-http';
import { AppLoggerService } from '@abms/core-logger';
import { DomainException } from '@abms/kernel';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

const DOMAIN_EXCEPTION_STATUS_MAP: Readonly<Record<string, HttpStatus>> = {
  'DOMAIN.VALIDATION_FAILED': HttpStatus.BAD_REQUEST,
  'DOMAIN.NOT_FOUND': HttpStatus.NOT_FOUND,
  'DOMAIN.BUSINESS_RULE_VIOLATION': HttpStatus.UNPROCESSABLE_ENTITY,
  'DOMAIN.CONCURRENCY_CONFLICT': HttpStatus.CONFLICT,
  // A missing/expired/invalid-signature JWT is a 401, not a malformed-request
  // 400 (which is where TenancyResolutionException's default still lands, e.g.
  // HeaderTenantResolver's failure mode). See ADR-0005.
  'AUTH.UNAUTHENTICATED': HttpStatus.UNAUTHORIZED,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  public constructor(private readonly logger: AppLoggerService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainException) {
      this.handleDomainException(exception, response);
      return;
    }

    if (exception instanceof HttpException) {
      this.handleHttpException(exception, response);
      return;
    }

    this.handleUnexpectedError(exception, response);
  }

  private handleDomainException(exception: DomainException, response: Response): void {
    const status = DOMAIN_EXCEPTION_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;
    this.logger.warn(`${exception.code}: ${exception.message}`, GlobalExceptionFilter.name);
    response
      .status(status)
      .json(
        createApiErrorResponse({
          code: exception.code,
          message: exception.message,
          details: exception.context,
        }),
      );
  }

  private handleHttpException(exception: HttpException, response: Response): void {
    const status = exception.getStatus();
    const body = exception.getResponse();
    const message =
      typeof body === 'string' ? body : ((body as { message?: string }).message ?? exception.message);
    this.logger.warn(`HTTP.${status}: ${message}`, GlobalExceptionFilter.name);
    response.status(status).json(createApiErrorResponse({ code: `HTTP.${status}`, message }));
  }

  private handleUnexpectedError(exception: unknown, response: Response): void {
    const error = exception instanceof Error ? exception : new Error('Unknown error');
    this.logger.error(error.message, error.stack, GlobalExceptionFilter.name);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        createApiErrorResponse({
          code: 'INTERNAL.UNEXPECTED_ERROR',
          message: 'An unexpected error occurred.',
        }),
      );
  }
}
