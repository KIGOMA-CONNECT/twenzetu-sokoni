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
    if (!user?.permissions) {
      return false;
    }
    const userPerms: string[] = user.permissions.split(',').filter(Boolean);
    return requiredPerms.some(p => userPerms.includes(p));
  }
}
