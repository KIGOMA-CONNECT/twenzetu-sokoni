import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPermission } from '@afri-market/identity-domain';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredPerms = this.reflector.getAllAndOverride<AdminPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPerms || requiredPerms.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (user?.role === 'super_admin') {
      return true;
    }
    const raw = user?.permissions;
    const userPerms: string[] =
      typeof raw === 'string'
        ? raw.split(',').filter(Boolean)
        : Array.isArray(raw)
          ? (raw as string[])
          : [];
    return requiredPerms.some(p => userPerms.includes(p));
  }
}
