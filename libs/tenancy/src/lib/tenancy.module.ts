import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { HeaderTenantResolver } from './header-tenant.resolver';
import { TENANT_RESOLVER } from './tenant-resolver.interface';

export interface TenancyModuleOptions {
  // Defaults to HeaderTenantResolver (dev/internal use). Production passes a
  // verified resolver (e.g. identity's JwtTenantResolver) — see ADR-0005.
  readonly resolverProvider?: Provider;
}

@Global()
@Module({})
export class TenancyModule {
  public static forRoot(options: TenancyModuleOptions = {}): DynamicModule {
    return {
      module: TenancyModule,
      providers: [
        AsyncLocalTenantContextStore,
        options.resolverProvider ?? { provide: TENANT_RESOLVER, useClass: HeaderTenantResolver },
      ],
      exports: [AsyncLocalTenantContextStore, TENANT_RESOLVER],
    };
  }
}
