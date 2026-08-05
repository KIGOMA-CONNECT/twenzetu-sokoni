import type { Request, Response } from 'express';
import { CurrentUserMiddleware } from './current-user.middleware';

function fakeRequest(user?: Record<string, unknown>): Request {
  const req = { user } as unknown as Record<string, unknown>;
  return req as unknown as Request;
}

describe('CurrentUserMiddleware', () => {
  it('copies an authenticated user onto currentUser and calls next()', () => {
    const middleware = new CurrentUserMiddleware();
    const next = jest.fn();
    const user = { userId: 'user-a', tenantId: 't1', role: 'CEO', phoneNumber: '+255712345678' };

    const req = fakeRequest(user);

    middleware.use(req, {} as Response, next);

    expect((req as unknown as Record<string, unknown>)['currentUser']).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('leaves currentUser unset when there is no authenticated user', () => {
    const middleware = new CurrentUserMiddleware();
    const next = jest.fn();

    const req = fakeRequest(undefined);

    middleware.use(req, {} as Response, next);

    expect((req as unknown as Record<string, unknown>)['currentUser']).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
