import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ITenantResolver } from './tenant-resolver.interface';

/**
 * Resolves tenant from the JWT-decoded user object first (authoritative),
 * falling back to the x-tenant-id header only for unauthenticated routes
 * (public catalog, webhooks, etc.).
 *
 * For authenticated routes the header is IGNORED — tenant is always derived
 * from the signed JWT to prevent spoofing.
 */
@Injectable()
export class HeaderTenantResolver implements ITenantResolver {
  public async resolve(request: Request): Promise<string | null> {
    const reqRecord = request as unknown as Record<string, unknown>;
    const user = reqRecord['user'] as { tenantId?: string } | undefined;
    if (user?.tenantId) {
      return user.tenantId;
    }
    const tenantId = request.headers['x-tenant-id'];
    if (typeof tenantId === 'string' && tenantId.trim().length > 0) {
      return tenantId.trim();
    }
    return null;
  }
}
