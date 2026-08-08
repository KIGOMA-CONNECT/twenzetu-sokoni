import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule,
    CacheModule.register(),
  ],
  controllers: [HealthController],
})
export class HealthModule implements OnModuleInit {
  constructor(private readonly healthController: HealthController) {}

  async onModuleInit(): Promise<void> {
    try {
      const { QueueService } = await import('@afri-market/core-queue');
      const queueService = new QueueService() as unknown as { getQueueStats(): Promise<Record<string, unknown>> };
      this.healthController.setQueueService(queueService);
    } catch {
      // Queue module not available — health check will skip queue stats
    }

    try {
      const { CircuitBreakerService } = await import('@afri-market/core-resilience');
      const cbService = new CircuitBreakerService() as unknown as { getStats(): Record<string, unknown> };
      this.healthController.setCircuitBreakerService(cbService);
    } catch {
      // Resilience module not available — health check will skip circuit breaker stats
    }
  }
}
