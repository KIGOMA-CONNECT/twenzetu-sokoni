import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { ITenantResolver } from './tenant-resolver.interface';
import { TenantResolutionException } from './tenant-resolution.exception';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly store: AsyncLocalTenantContextStore,
    private readonly resolver: ITenantResolver,
  ) {}

  public async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const tenantId = await this.resolver.resolve(req);
    if (!tenantId) {
      throw new TenantResolutionException('Unable to resolve tenant from request');
    }
    this.store.setTenantId(tenantId);
    next();
  }
}
