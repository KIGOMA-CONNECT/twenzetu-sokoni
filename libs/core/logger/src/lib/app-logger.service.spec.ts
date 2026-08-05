const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
};

jest.mock('pino', () => ({
  __esModule: true,
  default: jest.fn(() => mockLogger),
}));

import { AppLoggerService } from './app-logger.service';

describe('AppLoggerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes log() through pino.info with the message and context', () => {
    const service = new AppLoggerService();

    service.log('hello world', 'TestContext');

    expect(mockLogger.info).toHaveBeenCalledWith({ context: 'TestContext' }, 'hello world');
  });

  it('routes error() through pino.error including the stack trace', () => {
    const service = new AppLoggerService();

    service.error('boom', 'stack-trace-text', 'TestContext');

    expect(mockLogger.error).toHaveBeenCalledWith(
      { context: 'TestContext', trace: 'stack-trace-text' },
      'boom',
    );
  });

  it('routes warn() through pino.warn', () => {
    const service = new AppLoggerService();

    service.warn('w', 'WarnContext');

    expect(mockLogger.warn).toHaveBeenCalledWith({ context: 'WarnContext' }, 'w');
  });

  it('routes debug() through pino.debug', () => {
    const service = new AppLoggerService();

    service.debug('d', 'DebugContext');

    expect(mockLogger.debug).toHaveBeenCalledWith({ context: 'DebugContext' }, 'd');
  });

  it('routes verbose() through pino.trace', () => {
    const service = new AppLoggerService();

    service.verbose('v', 'VerboseContext');

    expect(mockLogger.trace).toHaveBeenCalledWith({ context: 'VerboseContext' }, 'v');
  });
});
