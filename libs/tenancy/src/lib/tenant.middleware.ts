import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalTenantContextStore } from './async-local-tenant-context.store';
import { ITenantResolver, TENANT_RESOLVER } from './tenant-resolver.interface';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  public constructor(
    private readonly store: AsyncLocalTenantContextStore,
    @Inject(TENANT_RESOLVER) private readonly resolver: ITenantResolver,
  ) {}

  public use(req: Request, _res: Response, next: NextFunction): void {
    const tenantId = this.resolver.resolve(req);
    this.store.run(tenantId, () => next());
  }
}
