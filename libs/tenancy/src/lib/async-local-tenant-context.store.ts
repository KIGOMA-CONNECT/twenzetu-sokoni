import { ITenantContextStore } from '@abms/kernel';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

@Injectable()
export class AsyncLocalTenantContextStore implements ITenantContextStore {
  private readonly storage = new AsyncLocalStorage<string>();

  public getTenantId(): string | undefined {
    return this.storage.getStore();
  }

  public run<T>(tenantId: string, callback: () => T): T {
    return this.storage.run(tenantId, callback);
  }
}
