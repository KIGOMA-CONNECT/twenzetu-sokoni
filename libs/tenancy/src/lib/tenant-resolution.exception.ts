export class TenantResolutionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantResolutionException';
  }
}
