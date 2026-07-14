import { AUDIT_ENTITIES } from '@abms/audit';
import { AppConfigModule } from '@abms/core-config';
import { AppLoggerModule } from '@abms/core-logger';
import { CqrsModule } from '@abms/cqrs';
import { DatabaseModule } from '@abms/database';
import { IdentityModule } from '@abms/identity-api';
import { CurrentUserMiddleware, IDENTITY_ENTITIES, JwtTenantResolver } from '@abms/identity-infrastructure';
import { OrganizationModule } from '@abms/organization-api';
import { ORGANIZATION_ENTITIES } from '@abms/organization-infrastructure';
import { TENANT_RESOLVER, TenancyModule, TenantMiddleware } from '@abms/tenancy';
import { WorkflowModule } from '@abms/workflow-api';
import { WORKFLOW_ENTITIES } from '@abms/workflow-infrastructure';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    // Production tenant resolution comes from a verified JWT claim, not the
    // client-supplied X-Tenant-Id header (which anyone could spoof) — see
    // ADR-0005. HeaderTenantResolver remains available for internal/test use
    // via TenancyModule.forRoot() with no options.
    TenancyModule.forRoot({
      resolverProvider: { provide: TENANT_RESOLVER, useClass: JwtTenantResolver },
    }),
    DatabaseModule.forRoot([
      ...ORGANIZATION_ENTITIES,
      ...IDENTITY_ENTITIES,
      ...AUDIT_ENTITIES,
      ...WORKFLOW_ENTITIES,
    ]),
    // Current-user + audit-logger both default correctly with no options here
    // — see CqrsModule.forRoot()'s doc comments. See ADR-0006.
    CqrsModule.forRoot(),
    HealthModule,
    IdentityModule,
    OrganizationModule,
    WorkflowModule,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware, CurrentUserMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/*path', method: RequestMethod.ALL },
        // Tenant registration and login must run with no tenant context at
        // all — the whole point of login is to discover which tenant a user
        // belongs to. See ADR-0005.
        { path: 'auth/register-tenant', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.ALL },
      )
      .forRoutes('*path');
  }
}
