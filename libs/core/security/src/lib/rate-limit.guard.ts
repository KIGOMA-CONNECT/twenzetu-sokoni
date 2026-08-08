import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

const STRICT_CONFIG: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 10, // 10 requests per minute for sensitive endpoints
};

@Injectable()
export class PerUserRateLimitGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip;
    const key = `rate_limit:${userId}`;

    const current = (await this.cacheManager.get<number>(key)) || 0;

    if (current >= DEFAULT_CONFIG.maxRequests) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, current + 1, DEFAULT_CONFIG.windowMs);
    return true;
  }
}

@Injectable()
export class StrictRateLimitGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip;
    const key = `rate_limit_strict:${userId}`;

    const current = (await this.cacheManager.get<number>(key)) || 0;

    if (current >= STRICT_CONFIG.maxRequests) {
      throw new HttpException(
        'Too many requests for this action. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, current + 1, STRICT_CONFIG.windowMs);
    return true;
  }
}
