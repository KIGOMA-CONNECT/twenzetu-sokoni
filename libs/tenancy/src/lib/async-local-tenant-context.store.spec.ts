import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';

describe('AsyncLocalTenantContextStore', () => {
  it('returns null outside of any run()', () => {
    const store = new AsyncLocalTenantContextStore();

    expect(store.getTenantId()).toBeNull();
  });

  it('exposes the tenant id inside run()', async () => {
    const store = new AsyncLocalTenantContextStore();

    const result = await store.run('tenant-a', async () => store.getTenantId());

    expect(result).toBe('tenant-a');
  });

  it('does not leak the tenant id outside of run()', async () => {
    const store = new AsyncLocalTenantContextStore();

    await store.run('tenant-a', async () => undefined);

    expect(store.getTenantId()).toBeNull();
  });

  it('propagates the tenant id across an async continuation', async () => {
    const store = new AsyncLocalTenantContextStore();

    const result = await store.run('tenant-a', async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return store.getTenantId();
    });

    expect(result).toBe('tenant-a');
  });

  it('keeps concurrent requests for different tenants isolated from each other', async () => {
    const store = new AsyncLocalTenantContextStore();

    const runFor = (tenantId: string, delayMs: number) =>
      store.run(tenantId, async () => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return store.getTenantId();
      });

    const [resultA, resultB] = await Promise.all([runFor('tenant-a', 10), runFor('tenant-b', 0)]);

    expect(resultA).toBe('tenant-a');
    expect(resultB).toBe('tenant-b');
  });
});
