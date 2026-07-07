import { CanActivate, Injectable } from '@nestjs/common';

// Deliberate, fully working stand-in until the Auth sprint adds real authentication/RBAC guards — not a partial implementation.
@Injectable()
export class NoopAuthGuard implements CanActivate {
  public canActivate(): boolean {
    return true;
  }
}
