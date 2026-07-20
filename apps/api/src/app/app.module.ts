import { AUDIT_ENTITIES } from '@abms/audit';
import { AppConfigModule } from '@abms/core-config';
import { AppLoggerModule } from '@abms/core-logger';
import { CqrsModule } from '@abms/cqrs';
import { DatabaseModule } from '@abms/database';
import { HrModule } from '@abms/hr-api';
import { HR_ENTITIES } from '@abms/hr-infrastructure';
import { LeaveAttendanceModule } from '@abms/hr-leave-attendance-api';
import { HR_LEAVE_ATTENDANCE_ENTITIES } from '@abms/hr-leave-attendance-infrastructure';
import { PayrollModule } from '@abms/hr-payroll-api';
import { HR_PAYROLL_ENTITIES } from '@abms/hr-payroll-infrastructure';
import { CompensationModule } from '@abms/hr-compensation-api';
import { HR_COMPENSATION_ENTITIES } from '@abms/hr-compensation-infrastructure';
import { LearningModule } from '@abms/hr-learning-api';
import { HR_LEARNING_ENTITIES } from '@abms/hr-learning-infrastructure';
import { SuccessionModule } from '@abms/hr-succession-api';
import { HR_SUCCESSION_ENTITIES } from '@abms/hr-succession-infrastructure';
import { ComplianceModule } from '@abms/hr-compliance-api';
import { HR_COMPLIANCE_ENTITIES } from '@abms/hr-compliance-infrastructure';
import { OffboardingModule } from '@abms/hr-offboarding-api';
import { HR_OFFBOARDING_ENTITIES } from '@abms/hr-offboarding-infrastructure';
import { PerformanceModule } from '@abms/hr-performance-api';
import { HR_PERFORMANCE_ENTITIES } from '@abms/hr-performance-infrastructure';
import { RecruitmentModule } from '@abms/hr-recruitment-api';
import { HR_RECRUITMENT_ENTITIES } from '@abms/hr-recruitment-infrastructure';
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
      ...HR_ENTITIES,
      ...HR_LEAVE_ATTENDANCE_ENTITIES,
      ...HR_PAYROLL_ENTITIES,
      ...HR_RECRUITMENT_ENTITIES,
      ...HR_PERFORMANCE_ENTITIES,
      ...HR_OFFBOARDING_ENTITIES,
      ...HR_COMPENSATION_ENTITIES,
      ...HR_LEARNING_ENTITIES,
      ...HR_SUCCESSION_ENTITIES,
      ...HR_COMPLIANCE_ENTITIES,
    ]),
    // Current-user + audit-logger both default correctly with no options here
    // — see CqrsModule.forRoot()'s doc comments. See ADR-0006.
    CqrsModule.forRoot(),
    HealthModule,
    IdentityModule,
    OrganizationModule,
    WorkflowModule,
    HrModule,
    LeaveAttendanceModule,
    PayrollModule,
    RecruitmentModule,
    PerformanceModule,
    OffboardingModule,
    CompensationModule,
    LearningModule,
    SuccessionModule,
    ComplianceModule,
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
