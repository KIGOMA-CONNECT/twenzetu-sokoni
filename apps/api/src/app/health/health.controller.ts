import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@SkipThrottle()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service healthy' })
  public async check() {
    let dbStatus = 'ok';
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'error';
    }

    let redisStatus = 'ok';
    let redisLatencyMs = 0;
    try {
      const start = Date.now();
      await this.cacheManager.get('health-check');
      redisLatencyMs = Date.now() - start;
    } catch {
      redisStatus = 'error';
    }

    const memUsage = process.memoryUsage();

    return {
      status: dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'afriMarket API',
      version: process.env['APP_VERSION'] || '1.0.0',
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service ready to accept traffic' })
  public async ready() {
    let dbOk = true;
    let redisOk = true;

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      dbOk = false;
    }

    try {
      await this.cacheManager.get('ready-check');
    } catch {
      redisOk = false;
    }

    if (!dbOk || !redisOk) {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        database: dbOk ? 'ok' : 'error',
        redis: redisOk ? 'ok' : 'error',
      };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  public alive() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
