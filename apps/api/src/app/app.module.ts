import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisCacheModule, ThrottlerRedisStorage } from '@afri-market/tenancy';
import { AppConfigModule } from '@afri-market/core-config';
import { AppLoggerModule } from '@afri-market/core-logger';
import { AuditLoggerModule } from '@afri-market/core-security';
import { DatabaseModule } from '@afri-market/database';
import { TenancyModule, TENANT_RESOLVER } from '@afri-market/tenancy';
import { HeaderTenantResolver } from '@afri-market/tenancy';
import { IdentityModule } from '@afri-market/identity-api';
import { IDENTITY_ENTITIES } from '@afri-market/identity-infrastructure';
import { MarketplaceModule } from '@afri-market/marketplace-api';
import { MARKETPLACE_ENTITIES } from '@afri-market/marketplace-infrastructure';
import { CurrentUserMiddleware } from '@afri-market/identity-infrastructure';
import { TenantMiddleware } from '@afri-market/tenancy';
import { UssdModule, UssdSessionEntity } from '@afri-market/ussd';
import { QueueModule } from '@afri-market/core-queue';
import { AuditModule, AuditLogEntity } from '@afri-market/core-audit';
import { ResilienceModule } from '@afri-market/core-resilience';
import { TracingModule } from '@afri-market/core-tracing';
import { FinanceModule, FINANCE_ENTITIES } from '@afri-market/core-finance';
import { UbrModule } from '@abms/ubr-api';
import { UBR_ENTITIES } from '@abms/ubr-infrastructure';
import { MetadataModule } from '@abms/metadata-api';
import { METADATA_ENTITIES } from '@abms/metadata-infrastructure';
import { ConfigurationInfraModule, CONFIG_ENTITIES } from '@abms/configuration-infrastructure';
import { ConfigurationModule } from '@abms/configuration-api';
import { WorkflowInfraModule, WORKFLOW_ENTITIES } from '@abms/workflow-infrastructure';
import { WorkflowModule } from '@abms/workflow-api';
import { NotificationInfraModule, NOTIFICATION_ENTITIES } from '@abms/notification-infrastructure';
import { NotificationModule } from '@abms/notification-api';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from '@afri-market/ai';
import { AiApiModule } from '@afri-market/ai-api';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // NOTE: @nestjs/throttler v6 applies EVERY throttler in the array to every
    // request and a request fails if it exceeds ANY of them. Multiple named
    // throttlers therefore collapse to the lowest limit (10/min) globally,
    // which rate-limited every route. A single 'default' throttler is used and
    // route groups tighten it via @Throttle({ default: { ... } }).
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 300 }],
      // Redis-backed counters: limits survive restarts and are shared across
      // replicas (the default in-memory store resets on every deploy).
      storage: new ThrottlerRedisStorage(),
    }),
    RedisCacheModule,
    AppConfigModule,
    AppLoggerModule,
    AuditLoggerModule,
    TenancyModule.forRoot({
      resolverProvider: { provide: TENANT_RESOLVER, useClass: HeaderTenantResolver },
    }),
    DatabaseModule.forRoot([
      ...IDENTITY_ENTITIES,
      ...MARKETPLACE_ENTITIES,
      ...FINANCE_ENTITIES,
      ...UBR_ENTITIES,
      ...METADATA_ENTITIES,
      ...CONFIG_ENTITIES,
      ...WORKFLOW_ENTITIES,
      ...NOTIFICATION_ENTITIES,
      UssdSessionEntity,
      AuditLogEntity,
    ]),
    QueueModule,
    AuditModule,
    ResilienceModule,
    TracingModule,
    FinanceModule,
    UbrModule,
    MetadataModule,
    ConfigurationModule,
    WorkflowModule,
    NotificationModule,
    HealthModule,
    MetricsModule,
    IdentityModule,
    MarketplaceModule,
    AiModule,
    AiApiModule,
    SchedulerModule,
    UssdModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware, CurrentUserMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/*path', method: RequestMethod.ALL },
        { path: 'metrics', method: RequestMethod.ALL },
        { path: 'auth/register-tenant', method: RequestMethod.ALL },
        { path: 'auth/register', method: RequestMethod.ALL },
        { path: 'auth/default-tenant', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.ALL },
        { path: 'auth/send-otp', method: RequestMethod.ALL },
        { path: 'auth/verify-otp', method: RequestMethod.ALL },
        { path: 'auth/refresh', method: RequestMethod.ALL },
        { path: 'auth/logout', method: RequestMethod.ALL },
        { path: 'webhooks/*path', method: RequestMethod.ALL },
        { path: 'ussd/*path', method: RequestMethod.ALL },
        { path: 'public/*path', method: RequestMethod.ALL },
      )
      .forRoutes(
        '*path',
      );
  }
}
