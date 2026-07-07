import { Global, Module } from '@nestjs/common';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { HeaderTenantResolver } from './header-tenant.resolver';
import { TENANT_RESOLVER } from './tenant-resolver.interface';

@Global()
@Module({
  providers: [
    AsyncLocalTenantContextStore,
    { provide: TENANT_RESOLVER, useClass: HeaderTenantResolver },
  ],
  exports: [AsyncLocalTenantContextStore, TENANT_RESOLVER],
})
export class TenancyModule {}
