import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when a request reaches a tenant-scoped route without a resolvable
 * tenant context. Such requests are effectively unauthenticated (the web
 * client derives x-tenant-id at login), so this maps to HTTP 401 rather than
 * a misleading 500 — middleware runs before guards, so this is the earliest
 * honest signal we can send.
 */
export class TenantResolutionException extends UnauthorizedException {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'TenantResolutionException';
  }
}
