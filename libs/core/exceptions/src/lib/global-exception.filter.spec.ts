import { AppLoggerService } from '@afri-market/core-logger';
import {
  BusinessRuleViolationException,
  DomainException,
  NotFoundException,
  ValidationDomainException,
} from '@afri-market/kernel';
import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';

class FakeAuthenticationFailedException extends DomainException {
  public override readonly code = 'AUTH.UNAUTHENTICATED';

  public constructor(message: string) {
    super(message);
  }
}

function fakeLogger(): jest.Mocked<AppLoggerService> {
  return {
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
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
  it('maps a NotFoundException to 404 with its domain error code', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new NotFoundException('Tenant', 'abc-123'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      }),
    );
  });

  it('maps an AUTH.UNAUTHENTICATED domain exception to 401', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new FakeAuthenticationFailedException('Invalid or expired access token.'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'AUTH.UNAUTHENTICATED' }) }),
    );
  });

  it('maps a ValidationDomainException to 400 with its error code', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new ValidationDomainException('invalid'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) }),
    );
  });

  it('maps a BusinessRuleViolationException to 409', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(
      new BusinessRuleViolationException('Order is not payable', 'ORDER_NOT_PAYABLE'),
      fakeHost(response),
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('maps a generic DomainException to 400 with its own code', () => {
    class GenericDomainException extends DomainException {
      public override readonly code = 'CUSTOM_CODE';

      public constructor(message: string) {
        super(message);
      }
    }
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(new GenericDomainException('boom'), fakeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'CUSTOM_CODE' }) }),
    );
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

  it('joins array messages from class-validator so validation errors are not lost', () => {
    const logger = fakeLogger();
    const filter = new GlobalExceptionFilter(logger);
    const response = fakeResponse();

    filter.catch(
      new BadRequestException({
        message: ['phoneNumber should not be empty', 'password must contain an uppercase letter'],
      }),
      fakeHost(response),
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'phoneNumber should not be empty; password must contain an uppercase letter',
        }),
      }),
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
        error: expect.objectContaining({
          code: 'INTERNAL.UNEXPECTED_ERROR',
          message: 'An unexpected error occurred.',
        }),
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('leaked db connection string'),
      expect.any(String),
      GlobalExceptionFilter.name,
    );
  });
});
