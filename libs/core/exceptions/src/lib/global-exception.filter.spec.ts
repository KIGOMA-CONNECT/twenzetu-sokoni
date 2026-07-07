import { AppLoggerService } from '@abms/core-logger';
import { NotFoundDomainException, ValidationDomainException } from '@abms/kernel';
import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';

function fakeLogger(): jest.Mocked<AppLoggerService> {
  return {
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
  } as unknown as jest.Mocked<AppLoggerService>;
}

function fakeHost(response: jest.Mocked<Response>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ArgumentsHost;
}

function fakeResponse(): jest.Mocked<Response> {
  const response = {} as jest.Mocked<Response>;
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
}

describe('GlobalExceptionFilter', () => {
  it('maps a NotFoundDomainException to 404 with its domain error code', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new NotFoundDomainException('Tenant', 'abc-123'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'DOMAIN.NOT_FOUND' }),
      }),
    );
  });

  it('maps a ValidationDomainException to 400', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new ValidationDomainException('invalid'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('passes through a NestJS HttpException with its own status', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new BadRequestException('bad payload'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'HTTP.400' }) }),
    );
  });

  it('maps an unknown error to a generic 500 without leaking internal details', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new Error('leaked db connection string'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: { code: 'INTERNAL.UNEXPECTED_ERROR', message: 'An unexpected error occurred.' },
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'leaked db connection string',
      expect.any(String),
      GlobalExceptionFilter.name,
    );
  });
});
