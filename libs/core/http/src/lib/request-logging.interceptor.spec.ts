import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { of } from 'rxjs';

describe('RequestLoggingInterceptor', () => {
  const buildLogger = () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  });

  const buildContext = (url: string) => {
    const res = { statusCode: 200 };
    return {
      switchToHttp: jest.fn(() => ({
        getRequest: () => ({ method: 'GET', url, user: { sub: 'u1', tenantId: 't1' } }),
        getResponse: () => res,
      })),
    } as never;
  };

  it('logs regular requests at INFO', (done) => {
    const logger = buildLogger();
    const interceptor = new RequestLoggingInterceptor(logger as never);

    interceptor.intercept(buildContext('/api/orders'), { handle: () => of('ok') } as never).subscribe(() => {
      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.log.mock.calls[0][0]).toContain('GET /api/orders 200');
      expect(logger.log.mock.calls[0][0]).toContain('[user=u1 tenant=t1]');
      expect(logger.debug).not.toHaveBeenCalled();
      done();
    });
  });

  it('keeps health and metrics probes at DEBUG', (done) => {
    const logger = buildLogger();
    const interceptor = new RequestLoggingInterceptor(logger as never);

    interceptor.intercept(buildContext('/health'), { handle: () => of('ok') } as never).subscribe(() => {
      interceptor.intercept(buildContext('/metrics'), { handle: () => of('ok') } as never).subscribe(() => {
        expect(logger.debug).toHaveBeenCalledTimes(2);
        expect(logger.log).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
