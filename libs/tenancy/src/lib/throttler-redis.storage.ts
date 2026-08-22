import Redis from 'ioredis';
import { ThrottlerStorage } from '@nestjs/throttler';

/** Mirrors @nestjs/throttler's ThrottlerStorageRecord (not exported from the root barrel). */
interface ThrottlerRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

const KEY_PREFIX = 'thr';

/**
 * Redis-backed rate-limit store for @nestjs/throttler.
 *
 * The default in-memory store resets on every API restart and is not shared
 * across replicas; this one survives both. Counters use atomic INCR/PTTL so
 * concurrent requests cannot race past the limit.
 */
export class ThrottlerRedisStorage implements ThrottlerStorage {
  private readonly redis: Redis;
  private ownsConnection: boolean;

  constructor(redisOrUrl?: Redis | string) {
    if (typeof redisOrUrl === 'string') {
      this.redis = new Redis(redisOrUrl);
      this.ownsConnection = true;
    } else if (redisOrUrl) {
      this.redis = redisOrUrl;
      this.ownsConnection = false;
    } else {
      this.redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');
      this.ownsConnection = true;
    }
  }

  public async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerRecord> {
    const cacheKey = `${KEY_PREFIX}:${throttlerName}:${key}`;

    const execResult = await this.redis
      .multi()
      .incr(cacheKey)
      .pttl(cacheKey)
      .exec();
    const totalHits = Number(execResult?.[0]?.[1] ?? 0);
    let timeToExpire = Number(execResult?.[1]?.[1] ?? -1);
    if (timeToExpire < 0) {
      // Key was evicted or expired between INCR and PTTL — restore its window.
      await this.redis.pexpire(cacheKey, ttl);
      timeToExpire = ttl;
    }

    if (totalHits <= limit) {
      return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
    }

    // Over the limit: keep a shadow key so the block outlives the counter TTL
    // when an explicit blockDuration is configured.
    const blockKey = `${cacheKey}:block`;
    const blockMs = blockDuration > 0 ? blockDuration : ttl;
    const blockTtl = await this.redis.pttl(blockKey);
    let timeToBlockExpire = Number(blockTtl);
    if (timeToBlockExpire < 0) {
      await this.redis.set(blockKey, '1', 'PX', Math.max(1, Math.floor(blockMs)));
      timeToBlockExpire = Math.max(1, Math.floor(blockMs));
    }

    return { totalHits, timeToExpire, isBlocked: true, timeToBlockExpire };
  }

  public async shutdown(): Promise<void> {
    if (this.ownsConnection) {
      this.redis.disconnect();
    }
  }
}
