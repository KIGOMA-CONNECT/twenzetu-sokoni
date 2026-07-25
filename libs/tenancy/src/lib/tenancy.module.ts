import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { HeaderTenantResolver } from './header-tenant.resolver';
import { TenantMiddleware } from './tenant.middleware';

export const TENANT_RESOLVER = 'TENANT_RESOLVER';
export const TENANT_CONTEXT_STORE = 'TENANT_CONTEXT_STORE';

@Module({})
export class TenancyModule {
  public static forRoot(options?: {
    resolverProvider?: Provider;
  }): DynamicModule {
    const resolverProvider = options?.resolverProvider || {
      provide: TENANT_RESOLVER,
      useClass: HeaderTenantResolver,
    };

    return {
      module: TenancyModule,
      providers: [
        AsyncLocalTenantContextStore,
        resolverProvider,
        {
          provide: TENANT_CONTEXT_STORE,
          useExisting: AsyncLocalTenantContextStore,
        },
        TenantMiddleware,
      ],
      exports: [
        AsyncLocalTenantContextStore,
        resolverProvider,
        TENANT_CONTEXT_STORE,
        TenantMiddleware,
      ],
    };
  }
}
