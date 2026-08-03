import { AppConfigService } from '@abms/core-config';
import type pino from 'pino';
import { AppLoggerService } from './app-logger.service';

function fakeConfig(): AppConfigService {
  return {
    logging: { level: 'info', pretty: false },
  } as unknown as AppConfigService;
}

function fakePinoLogger(): jest.Mocked<pino.Logger> {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  } as unknown as jest.Mocked<pino.Logger>;
}

describe('AppLoggerService', () => {
  it('routes log() through pino.info with the message', () => {
    const logger = fakePinoLogger();
    const service = new AppLoggerService(fakeConfig(), logger);

    service.log('hello world', 'TestContext');

    expect(logger.info).toHaveBeenCalledWith({ context: 'TestContext' }, 'hello world');
  });

  it('routes error() through pino.error including the stack trace', () => {
    const logger = fakePinoLogger();
    const service = new AppLoggerService(fakeConfig(), logger);

    service.error('boom', 'stack-trace-text', 'TestContext');

    expect(logger.error).toHaveBeenCalledWith(
      { context: 'TestContext', trace: 'stack-trace-text' },
      'boom',
    );
  });

  it('stringifies non-string messages', () => {
    const logger = fakePinoLogger();
    const service = new AppLoggerService(fakeConfig(), logger);

    service.log({ orderId: 42 });

    expect(logger.info).toHaveBeenCalledWith({}, JSON.stringify({ orderId: 42 }));
  });

  it('merges fields from every registered context enricher', () => {
    const logger = fakePinoLogger();
    const service = new AppLoggerService(fakeConfig(), logger);

    service.registerContextEnricher(() => ({ tenantId: 'tenant-a' }));
    service.registerContextEnricher(() => ({ requestId: 'req-1' }));
    service.log('hello');

    expect(logger.info).toHaveBeenCalledWith(
      { tenantId: 'tenant-a', requestId: 'req-1' },
      'hello',
    );
  });

  it('routes warn/debug/verbose/fatal to their pino equivalents', () => {
    const logger = fakePinoLogger();
    const service = new AppLoggerService(fakeConfig(), logger);

    service.warn('w');
    service.debug('d');
    service.verbose('v');
    service.fatal('f');

    expect(logger.warn).toHaveBeenCalledWith({}, 'w');
    expect(logger.debug).toHaveBeenCalledWith({}, 'd');
    expect(logger.trace).toHaveBeenCalledWith({}, 'v');
    expect(logger.fatal).toHaveBeenCalledWith({}, 'f');
  });
});
