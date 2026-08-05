import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { ITenantResolver } from './tenant-resolver.interface';
import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
  it('resolves the tenant id and runs next() inside that tenant context', async () => {
    const store = new AsyncLocalTenantContextStore();
    const resolver: ITenantResolver = { resolve: jest.fn().mockResolvedValue('tenant-a') };
    const middleware = new TenantMiddleware(store, resolver);

    let observedTenantId: string | null = null;
    const next: NextFunction = () => {
      observedTenantId = store.getTenantId();
    };

    await middleware.use({} as Request, {} as Response, next);

    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(observedTenantId).toBe('tenant-a');
    expect(store.getTenantId()).toBeNull();
  });

  it('throws TenantResolutionException when no tenant is resolved and does not call next()', async () => {
    const store = new AsyncLocalTenantContextStore();
    const resolver: ITenantResolver = { resolve: jest.fn().mockResolvedValue(null) };
    const middleware = new TenantMiddleware(store, resolver);
    const next: NextFunction = jest.fn();

    await expect(middleware.use({} as Request, {} as Response, next)).rejects.toThrow(
      'Unable to resolve tenant from request',
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('propagates a resolution failure without calling next()', async () => {
    const store = new AsyncLocalTenantContextStore();
    const resolver: ITenantResolver = {
      resolve: jest.fn(() => {
        throw new Error('missing header');
      }),
    };
    const middleware = new TenantMiddleware(store, resolver);
    const next: NextFunction = jest.fn();

    await expect(middleware.use({} as Request, {} as Response, next)).rejects.toThrow('missing header');
    expect(next).not.toHaveBeenCalled();
  });
});
