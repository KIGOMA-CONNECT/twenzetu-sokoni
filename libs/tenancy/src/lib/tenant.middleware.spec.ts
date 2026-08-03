import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { ITenantResolver } from './tenant-resolver.interface';
import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
  it('resolves the tenant id and runs next() inside that tenant context', () => {
    const store = new AsyncLocalTenantContextStore();
    const resolver: ITenantResolver = { resolve: jest.fn().mockReturnValue('tenant-a') };
    const middleware = new TenantMiddleware(store, resolver);

    let observedTenantId: string | undefined;
    const next: NextFunction = () => {
      observedTenantId = store.getTenantId();
    };

    middleware.use({} as Request, {} as Response, next);

    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(observedTenantId).toBe('tenant-a');
    expect(store.getTenantId()).toBeUndefined();
  });

  it('propagates a resolution failure without calling next()', () => {
    const store = new AsyncLocalTenantContextStore();
    const resolver: ITenantResolver = {
      resolve: jest.fn(() => {
        throw new Error('missing header');
      }),
    };
    const middleware = new TenantMiddleware(store, resolver);
    const next: NextFunction = jest.fn();

    expect(() => middleware.use({} as Request, {} as Response, next)).toThrow('missing header');
    expect(next).not.toHaveBeenCalled();
  });
});
