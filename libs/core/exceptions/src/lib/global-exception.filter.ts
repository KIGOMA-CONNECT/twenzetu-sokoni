import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '@afri-market/core-logger';
import {
  BusinessRuleViolationException,
  DomainException,
  NotFoundException,
  ValidationDomainException,
} from '@afri-market/kernel';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred.';
    let code = 'INTERNAL.UNEXPECTED_ERROR';

    if (exception instanceof DomainException) {
      message = exception.message;
      code = exception.code;
      if (exception instanceof NotFoundException) {
        status = HttpStatus.NOT_FOUND;
      } else if (exception instanceof ValidationDomainException) {
        status = HttpStatus.BAD_REQUEST;
      } else if (exception instanceof BusinessRuleViolationException) {
        status = HttpStatus.CONFLICT;
      } else if (exception.code.startsWith('AUTH.')) {
        status = HttpStatus.UNAUTHORIZED;
      } else {
        status = HttpStatus.BAD_REQUEST;
      }
      this.logger.warn(`${request.method} ${request.url} - ${message}`, GlobalExceptionFilter.name);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else {
        const exRecord = exResponse as Record<string, unknown>;
        if (typeof exRecord['message'] === 'string') {
          message = exRecord['message'];
        } else if (Array.isArray(exRecord['message'])) {
          const parts = (exRecord['message'] as unknown[]).filter((m): m is string => typeof m === 'string');
          if (parts.length > 0) {
            message = parts.join('; ');
          }
        }
      }
      code = `HTTP.${status}`;
    } else if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} - ${exception.message}`,
        exception.stack,
        GlobalExceptionFilter.name,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
