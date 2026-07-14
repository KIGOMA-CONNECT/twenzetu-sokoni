import { ICurrentUserProvider } from '@abms/core-security';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { AuthenticatedRequestUser } from './jwt-payload.interface';

// First real implementation of ICurrentUserProvider (was unimplemented, see
// libs/core/security). Request-scoped since it reads request.user, populated
// by JwtStrategy.validate() after AuthGuard('jwt') runs.
@Injectable({ scope: Scope.REQUEST })
export class RequestCurrentUserProvider implements ICurrentUserProvider {
  public constructor(
    @Inject(REQUEST) private readonly request: Request & { user?: AuthenticatedRequestUser },
  ) {}

  public getCurrentUserId(): string | undefined {
    return this.request.user?.userId;
  }
}
