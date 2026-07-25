import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string | null;
}

@Injectable()
export class AsyncLocalTenantContextStore {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  public getTenantId(): string | null {
    const store = this.storage.getStore();
    return store?.tenantId ?? null;
  }

  public setTenantId(tenantId: string): void {
    const store = this.storage.getStore();
    if (store) {
      store.tenantId = tenantId;
    }
  }

  public async run<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
    return this.storage.run({ tenantId }, callback);
  }
}
