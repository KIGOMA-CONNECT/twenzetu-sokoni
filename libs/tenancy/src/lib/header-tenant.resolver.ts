import { isValidUuid } from '@abms/kernel';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { TenantResolutionException } from './tenant-resolution.exception';
import { ITenantResolver } from './tenant-resolver.interface';

export const TENANT_HEADER_NAME = 'x-tenant-id';

@Injectable()
export class HeaderTenantResolver implements ITenantResolver {
  public resolve(request: Request): string {
    const raw = request.header(TENANT_HEADER_NAME);

    if (!raw) {
      throw new TenantResolutionException(`Missing required "${TENANT_HEADER_NAME}" header.`);
    }
    if (!isValidUuid(raw)) {
      throw new TenantResolutionException(`"${TENANT_HEADER_NAME}" header is not a valid UUID.`, {
        value: raw,
      });
    }
    return raw;
  }
}
