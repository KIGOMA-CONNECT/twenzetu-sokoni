export interface IAsyncLocalTenantContextStore {
  getTenantId(): string | null;
  setTenantId(tenantId: string): void;
  run<T>(tenantId: string, callback: () => Promise<T>): Promise<T>;
}
