import { AsyncLocalCurrentUserStore } from '@abms/core-security';
import type { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { CurrentUserMiddleware } from './current-user.middleware';

function fakeRequest(authHeader?: string): Request {
  return { header: (name: string) => (name === 'authorization' ? authHeader : undefined) } as unknown as Request;
}

describe('CurrentUserMiddleware', () => {
  it('decodes the bearer token and runs next() inside that user context', () => {
    const store = new AsyncLocalCurrentUserStore();
    const jwtService = { decode: jest.fn().mockReturnValue({ sub: 'user-a' }) } as unknown as JwtService;
    const middleware = new CurrentUserMiddleware(store, jwtService);

    let observedUserId: string | undefined;
    const next: NextFunction = () => {
      observedUserId = store.getCurrentUserId();
    };

    middleware.use(fakeRequest('Bearer some.jwt.token'), {} as Response, next);

    expect(jwtService.decode).toHaveBeenCalledWith('some.jwt.token');
    expect(observedUserId).toBe('user-a');
    expect(store.getCurrentUserId()).toBeUndefined();
  });

  it('runs next() with no current user when the Authorization header is missing', () => {
    const store = new AsyncLocalCurrentUserStore();
    const jwtService = { decode: jest.fn() } as unknown as JwtService;
    const middleware = new CurrentUserMiddleware(store, jwtService);

    let observedUserId: string | undefined = 'sentinel';
    const next: NextFunction = () => {
      observedUserId = store.getCurrentUserId();
    };

    middleware.use(fakeRequest(undefined), {} as Response, next);

    expect(jwtService.decode).not.toHaveBeenCalled();
    expect(observedUserId).toBeUndefined();
  });

  it('runs next() with no current user when the token cannot be decoded', () => {
    const store = new AsyncLocalCurrentUserStore();
    const jwtService = { decode: jest.fn().mockReturnValue(null) } as unknown as JwtService;
    const middleware = new CurrentUserMiddleware(store, jwtService);

    let observedUserId: string | undefined = 'sentinel';
    const next: NextFunction = () => {
      observedUserId = store.getCurrentUserId();
    };

    middleware.use(fakeRequest('Bearer garbage'), {} as Response, next);

    expect(observedUserId).toBeUndefined();
  });
});
