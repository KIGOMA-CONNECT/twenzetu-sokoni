import { Request } from 'express';

export interface ITenantResolver {
  resolve(request: Request): Promise<string | null>;
}
