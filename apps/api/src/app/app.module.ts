import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisCacheModule } from '@afri-market/tenancy';
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
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60000, limit: 5 },
      { name: 'write', ttl: 60000, limit: 30 },
      { name: 'read', ttl: 60000, limit: 120 },
      { name: 'admin', ttl: 60000, limit: 60 },
    ]),
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
    ]),
    HealthModule,
    IdentityModule,
    MarketplaceModule,
    SchedulerModule,
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
        { path: 'api/auth/register-tenant', method: RequestMethod.ALL },
        { path: 'api/auth/login', method: RequestMethod.ALL },
        { path: 'api/auth/send-otp', method: RequestMethod.ALL },
        { path: 'api/auth/verify-otp', method: RequestMethod.ALL },
      )
      .forRoutes('*path');
  }
}
