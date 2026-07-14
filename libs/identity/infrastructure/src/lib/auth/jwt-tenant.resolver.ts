import { AuthenticationFailedException } from '@abms/identity-domain';
import { ITenantResolver } from '@abms/tenancy';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtPayload } from './jwt-payload.interface';

const AUTH_HEADER_NAME = 'authorization';
const BEARER_PREFIX = 'Bearer ';

/**
 * Decodes the JWT independently of Passport's AuthGuard('jwt') — tenant context
 * must be established at Middleware time (TenantMiddleware), which runs before
 * any Guard in Nest's request lifecycle. Extract-only (tenantId claim), not full
 * validation — isActive/user-lookup is JwtStrategy.validate()'s job later in the
 * pipeline. See ADR-0005.
 */
@Injectable()
export class JwtTenantResolver implements ITenantResolver {
  public constructor(private readonly jwtService: JwtService) {}

  public resolve(request: Request): string {
    const header = request.header(AUTH_HEADER_NAME);
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new AuthenticationFailedException('Missing or malformed Authorization header.');
    }

    const token = header.slice(BEARER_PREFIX.length);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload.tenantId;
    } catch {
      throw new AuthenticationFailedException('Invalid or expired access token.');
    }
  }
}
