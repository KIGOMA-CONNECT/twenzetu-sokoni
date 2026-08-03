import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ICurrentUserProvider } from './current-user-provider.interface';

// Mirrors AsyncLocalTenantContextStore (libs/tenancy): a singleton backed by
// AsyncLocalStorage, populated by middleware early in the request lifecycle.
// Request-scoped DI (the previous RequestCurrentUserProvider) does not work
// here because @nestjs/cqrs command/query handlers are resolved once at
// bootstrap, before any HTTP request exists — a request-scoped dependency
// injected into them never sees the actual current request. AsyncLocalStorage
// sidesteps Nest's DI scoping entirely by threading the value through the
// async call chain instead.
@Injectable()
export class AsyncLocalCurrentUserStore implements ICurrentUserProvider {
  private readonly storage = new AsyncLocalStorage<string | undefined>();

  public getCurrentUserId(): string | undefined {
    return this.storage.getStore();
  }

  public run<T>(userId: string | undefined, callback: () => T): T {
    return this.storage.run(userId, callback);
  }
}
