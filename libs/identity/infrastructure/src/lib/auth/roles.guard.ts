import { UserRole } from '@abms/identity-domain';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthenticatedRequestUser } from './jwt-payload.interface';
import { ROLES_KEY } from './roles.decorator';

// Replaces NoopAuthGuard (removed) as the sprint's real guard story, per
// ADR-0005. Requires AuthGuard('jwt') to have already populated request.user.
@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedRequestUser }>();
    return !!request.user && requiredRoles.includes(request.user.role);
  }
}
