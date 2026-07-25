export class TenantContextMissingException extends Error {
  constructor() {
    super('Tenant context is missing. All tenant-scoped operations require an active tenant context.');
    this.name = 'TenantContextMissingException';
  }
}
