import { AppConfigModule } from '@abms/core-config';
import { AppLoggerModule } from '@abms/core-logger';
import { CqrsModule } from '@abms/cqrs';
import { DatabaseModule } from '@abms/database';
import { TenancyModule, TenantMiddleware } from '@abms/tenancy';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    TenancyModule,
    DatabaseModule.forRoot([]),
    CqrsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
