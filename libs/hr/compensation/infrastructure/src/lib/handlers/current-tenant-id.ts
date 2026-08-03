import { TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';

// TenantAwareUnitOfWork.withTransaction already throws TenantContextMissingException
// before invoking any handler if no tenant context is active, so getTenantId() is
// guaranteed non-null by the time any handler's handle() method runs.
export function currentTenantId(tenantContext: AsyncLocalTenantContextStore): TenantId {
  const tenantId = tenantContext.getTenantId() as string;
  return TenantId.create(tenantId).getValue();
}
