import { AUDIT_LOGGER, TypeOrmAuditLogger } from '@abms/audit';
import { AsyncLocalCurrentUserStore, CURRENT_USER_PROVIDER } from '@abms/core-security';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { CqrsModule as NestCqrsModule } from '@nestjs/cqrs';
import { CommandBusAdapter } from './bus/command-bus.adapter';
import { EventBusAdapter } from './bus/event-bus.adapter';
import { QueryBusAdapter } from './bus/query-bus.adapter';

export interface CqrsModuleOptions {
  // Defaults to AsyncLocalCurrentUserStore. Request-scoped DI cannot be used
  // here: @nestjs/cqrs resolves command/query handlers once at bootstrap,
  // before any HTTP request exists, so a request-scoped provider injected
  // into them never sees the actual current request. AsyncLocalCurrentUserStore
  // sidesteps that by threading the user id through the async call chain
  // instead, populated by identity's CurrentUserMiddleware. See ADR-0006.
  readonly currentUserProviderOverride?: Provider;
  // Defaults to TypeOrmAuditLogger (needs only the globally-registered
  // DataSource, so unlike currentUser there's no bounded-context to wait for
  // — every command handler gets real audit logging from day one). See ADR-0006.
  readonly auditLoggerOverride?: Provider;
}

// Global, matching AppConfigModule/AppLoggerModule/TenancyModule/DatabaseModule:
// every future business module needs the command/query/event buses, so none should
// have to re-import this.
@Global()
@Module({})
export class CqrsModule {
  public static forRoot(options: CqrsModuleOptions = {}): DynamicModule {
    return {
      module: CqrsModule,
      imports: [NestCqrsModule],
      providers: [
        CommandBusAdapter,
        QueryBusAdapter,
        EventBusAdapter,
        AsyncLocalCurrentUserStore,
        options.currentUserProviderOverride ?? {
          provide: CURRENT_USER_PROVIDER,
          useExisting: AsyncLocalCurrentUserStore,
        },
        options.auditLoggerOverride ?? {
          provide: AUDIT_LOGGER,
          useClass: TypeOrmAuditLogger,
        },
      ],
      exports: [
        NestCqrsModule,
        CommandBusAdapter,
        QueryBusAdapter,
        EventBusAdapter,
        AsyncLocalCurrentUserStore,
        CURRENT_USER_PROVIDER,
        AUDIT_LOGGER,
      ],
    };
  }
}
