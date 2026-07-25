import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CachedOtp {
  code: string;
  attempts: number;
}

@Injectable()
export class OtpCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private key(phone: string): string {
    return `otp:${phone}`;
  }

  async store(phone: string, code: string, ttlMs: number): Promise<void> {
    const data: CachedOtp = { code, attempts: 0 };
    await this.cache.set(this.key(phone), data, ttlMs);
  }

  async verify(phone: string, code: string): Promise<{ valid: boolean; reason?: string }> {
    const cached = await this.cache.get<CachedOtp>(this.key(phone));
    if (!cached) {
      return { valid: false, reason: 'OTP expired or not found' };
    }
    if (cached.attempts >= 5) {
      await this.cache.del(this.key(phone));
      return { valid: false, reason: 'Too many attempts' };
    }
    if (cached.code !== code) {
      cached.attempts++;
      await this.cache.set(this.key(phone), cached, 300000);
      return { valid: false, reason: 'Invalid code' };
    }
    await this.cache.del(this.key(phone));
    return { valid: true };
  }

  async invalidate(phone: string): Promise<void> {
    await this.cache.del(this.key(phone));
  }
}
