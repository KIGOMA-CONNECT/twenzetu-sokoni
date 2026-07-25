import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ITenantResolver } from './tenant-resolver.interface';

@Injectable()
export class HeaderTenantResolver implements ITenantResolver {
  public async resolve(request: Request): Promise<string | null> {
    const tenantId = request.headers['x-tenant-id'];
    if (typeof tenantId === 'string' && tenantId.trim().length > 0) {
      return tenantId.trim();
    }
    return null;
  }
}
