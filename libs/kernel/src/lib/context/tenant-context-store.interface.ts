export interface ITenantContextStore {
  getTenantId(): string | undefined;
  run<T>(tenantId: string, callback: () => T): T;
}
