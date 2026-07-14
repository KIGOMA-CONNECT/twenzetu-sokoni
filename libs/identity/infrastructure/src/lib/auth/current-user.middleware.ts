import { AsyncLocalCurrentUserStore } from '@abms/core-security';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { JwtPayload } from './jwt-payload.interface';

const AUTH_HEADER_NAME = 'authorization';
const BEARER_PREFIX = 'Bearer ';

// Populates AsyncLocalCurrentUserStore from the JWT's `sub` claim so audit
// logging can attribute commands to a user — mirrors TenantMiddleware. By the
// time this runs, TenantMiddleware has already cryptographically verified the
// token (or the route is public/excluded and has no user at all), so a plain
// decode() here is enough — no need to verify the signature a second time.
// Fail-open: a missing/malformed token just means no current user, never a
// rejected request (that gate already happened in TenantMiddleware/AuthGuard).
@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  public constructor(
    private readonly store: AsyncLocalCurrentUserStore,
    private readonly jwtService: JwtService,
  ) {}

  public use(req: Request, _res: Response, next: NextFunction): void {
    const header = req.header(AUTH_HEADER_NAME);
    let userId: string | undefined;

    if (header && header.startsWith(BEARER_PREFIX)) {
      const decoded = this.jwtService.decode<JwtPayload>(header.slice(BEARER_PREFIX.length));
      userId = decoded?.sub;
    }

    this.store.run(userId, () => next());
  }
}
