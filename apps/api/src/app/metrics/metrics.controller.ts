import { timingSafeEqual } from 'crypto';
import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@SkipThrottle()
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  public async metrics(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<string> {
    const secret = process.env.METRICS_SECRET;
    if (secret) {
      const authHeader = headers['authorization'];
      const authToken = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      const provided = authToken && authToken.startsWith('Bearer ') ? authToken.substring('Bearer '.length) : '';
      const a = Buffer.from(provided || '');
      const b = Buffer.from(secret);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Invalid metrics token');
      }
    }

    let dbUp = 0;
    let redisUp = 0;

    try {
      await this.dataSource.query('SELECT 1');
      dbUp = 1;
    } catch { /* no-op */}

    try {
      await this.cacheManager.get('metrics-check');
      redisUp = 1;
    } catch { /* no-op */}

    const lines = [
      '# HELP afri_market_db_up Database connectivity (1=up, 0=down)',
      '# TYPE afri_market_db_up gauge',
      `afri_market_db_up ${dbUp}`,
      '',
      '# HELP afri_market_redis_up Redis connectivity (1=up, 0=down)',
      '# TYPE afri_market_redis_up gauge',
      `afri_market_redis_up ${redisUp}`,
      '',
      '# HELP afri_market_build_info Build metadata',
      '# TYPE afri_market_build_info gauge',
      `afri_market_build_info{version="1.0.0",service="afriMarket API"} 1`,
    ];

    return lines.join('\n');
  }
}
