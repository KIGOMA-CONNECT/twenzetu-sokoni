export interface ICurrentUserProvider {
  getCurrentUserId(): string | undefined;
}

// DI token: interfaces have no runtime shape, so consumers that need Nest to
// inject an ICurrentUserProvider implementation (e.g. TransactionalCommandHandler
// in libs/cqrs, for audit logging) must @Inject(CURRENT_USER_PROVIDER) — mirrors
// TENANT_RESOLVER in libs/tenancy.
export const CURRENT_USER_PROVIDER = Symbol('CURRENT_USER_PROVIDER');
