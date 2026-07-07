import type { Request } from 'express';

export interface ITenantResolver {
  resolve(request: Request): string;
}

export const TENANT_RESOLVER = Symbol('TENANT_RESOLVER');
