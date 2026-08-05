import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        stores: [createKeyv(redisUrl)],
        ttl: 300000,
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
