import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { HeaderTenantResolver } from './header-tenant.resolver';
import { TenantMiddleware } from './tenant.middleware';
import { TENANT_RESOLVER, TENANT_CONTEXT_STORE } from './tokens';

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
      global: true,
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
