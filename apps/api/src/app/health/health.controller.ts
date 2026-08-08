import { Controller, Get, Inject, Optional } from '@nestjs/common';
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
  private queueService: { getQueueStats(): Promise<Record<string, unknown>> } | null = null;
  private circuitBreakerService: { getStats(): Record<string, unknown> } | null = null;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  setQueueService(svc: { getQueueStats(): Promise<Record<string, unknown>> }): void {
    this.queueService = svc;
  }

  setCircuitBreakerService(svc: { getStats(): Record<string, unknown> }): void {
    this.circuitBreakerService = svc;
  }

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

    let queueStats: Record<string, unknown> = {};
    let queueStatus = 'ok';
    if (this.queueService) {
      try {
        queueStats = await this.queueService.getQueueStats();
      } catch {
        queueStatus = 'degraded';
      }
    }

    let circuitStats: Record<string, unknown> = {};
    if (this.circuitBreakerService) {
      circuitStats = this.circuitBreakerService.getStats();
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
      queues: {
        status: queueStatus,
        ...queueStats,
      },
      circuitBreakers: circuitStats,
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
