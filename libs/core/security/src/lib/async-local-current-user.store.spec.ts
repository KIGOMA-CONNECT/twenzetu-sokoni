import { AsyncLocalCurrentUserStore } from './async-local-current-user.store';

describe('AsyncLocalCurrentUserStore', () => {
  it('returns undefined outside of any run()', () => {
    const store = new AsyncLocalCurrentUserStore();

    expect(store.getCurrentUserId()).toBeUndefined();
  });

  it('exposes the user id inside run()', () => {
    const store = new AsyncLocalCurrentUserStore();

    const result = store.run('user-a', () => store.getCurrentUserId());

    expect(result).toBe('user-a');
  });

  it('does not leak the user id outside of run()', () => {
    const store = new AsyncLocalCurrentUserStore();

    store.run('user-a', () => undefined);

    expect(store.getCurrentUserId()).toBeUndefined();
  });

  it('propagates the user id across an async continuation', async () => {
    const store = new AsyncLocalCurrentUserStore();

    const result = await store.run('user-a', async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return store.getCurrentUserId();
    });

    expect(result).toBe('user-a');
  });

  it('runs with undefined when no authenticated user is present (public routes)', () => {
    const store = new AsyncLocalCurrentUserStore();

    const result = store.run(undefined, () => store.getCurrentUserId());

    expect(result).toBeUndefined();
  });

  it('keeps concurrent requests for different users isolated from each other', async () => {
    const store = new AsyncLocalCurrentUserStore();

    const runFor = (userId: string, delayMs: number) =>
      store.run(userId, async () => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return store.getCurrentUserId();
      });

    const [resultA, resultB] = await Promise.all([runFor('user-a', 10), runFor('user-b', 0)]);

    expect(resultA).toBe('user-a');
    expect(resultB).toBe('user-b');
  });
});
