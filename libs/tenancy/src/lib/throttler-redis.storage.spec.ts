import { ThrottlerRedisStorage } from './throttler-redis.storage';

interface RedisMock {
  multi: jest.Mock;
  incr: jest.Mock;
  pttl: jest.Mock;
  exec: jest.Mock;
  pexpire: jest.Mock;
  set: jest.Mock;
  disconnect: jest.Mock;
}

const buildRedisMock = (): RedisMock => ({
  multi: jest.fn().mockReturnThis(),
  incr: jest.fn().mockReturnThis(),
  pttl: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([
    [null, 1],
    [null, 60000],
  ]),
  pexpire: jest.fn().mockResolvedValue(1),
  set: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn(),
});

describe('ThrottlerRedisStorage', () => {
  it('returns the hit count without blocking while under the limit', async () => {
    const redis = buildRedisMock();
    const storage = new ThrottlerRedisStorage(redis as never);

    const record = await storage.increment('key-1', 60000, 300, 0, 'default');

    expect(record).toEqual({
      totalHits: 1,
      timeToExpire: 60000,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(redis.incr).toHaveBeenCalledWith('thr:default:key-1');
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('blocks and records a shadow key once over the limit', async () => {
    const redis = buildRedisMock();
    redis.exec.mockResolvedValue([
      [null, 301],
      [null, 60000],
    ]);
    // Standalone PTTL for the shadow key (chained calls return the mock itself).
    redis.pttl.mockImplementation((key?: unknown) =>
      typeof key === 'string' && key.endsWith(':block') ? Promise.resolve(-1) : redis,
    );

    const storage = new ThrottlerRedisStorage(redis as never);
    const record = await storage.increment('key-1', 60000, 300, 120000, 'default');

    expect(record.isBlocked).toBe(true);
    expect(record.timeToBlockExpire).toBe(120000);
    expect(redis.set).toHaveBeenCalledWith('thr:default:key-1:block', '1', 'PX', 120000);
  });

  it('reuses an existing block window instead of extending it', async () => {
    const redis = buildRedisMock();
    redis.exec.mockResolvedValue([
      [null, 400],
      [null, 60000],
    ]);
    redis.pttl.mockImplementation((key?: unknown) =>
      typeof key === 'string' && key.endsWith(':block') ? Promise.resolve(5000) : redis,
    );

    const storage = new ThrottlerRedisStorage(redis as never);
    const record = await storage.increment('key-1', 60000, 300, 120000, 'default');

    expect(record.isBlocked).toBe(true);
    expect(record.timeToBlockExpire).toBe(5000);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('restores the expiry window when the counter key has none', async () => {
    const redis = buildRedisMock();
    redis.exec.mockResolvedValue([
      [null, 5],
      [null, -1],
    ]);

    const storage = new ThrottlerRedisStorage(redis as never);
    const record = await storage.increment('key-2', 45000, 300, 0, 'default');

    expect(record.timeToExpire).toBe(45000);
    expect(record.isBlocked).toBe(false);
    expect(redis.pexpire).toHaveBeenCalledWith('thr:default:key-2', 45000);
  });

  it('does not close a redis connection it does not own', async () => {
    const redis = buildRedisMock();
    const storage = new ThrottlerRedisStorage(redis as never);

    await storage.shutdown();

    expect(redis.disconnect).not.toHaveBeenCalled();
  });
});
