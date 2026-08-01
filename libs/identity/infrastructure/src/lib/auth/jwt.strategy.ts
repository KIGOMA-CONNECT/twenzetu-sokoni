import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '@afri-market/core-config';
import { EntityId } from '@afri-market/kernel';
import { IUserRepository } from '@afri-market/identity-domain';
import { USER_REPOSITORY } from '../identity-handlers';
import { SessionService } from './session.service';
import { JwtPayload } from './jwt-payload.interface';

/**
 * Validates every protected request against the JWT signature AND the live
 * session row. A revoked session (force-logout / suspension) or a suspended
 * user therefore invalidates existing access tokens immediately — the access
 * token alone is never sufficient after a session is killed.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: AppConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  public async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.sid || payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid token.');
    }

    const [sessionValid, user] = await Promise.all([
      this.sessionService.isSessionValid(payload.sid),
      this.userRepo.findById(EntityId.from(payload.sub)),
    ]);

    if (!sessionValid) {
      throw new UnauthorizedException('Session has been revoked.');
    }

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended. Contact support.');
    }

    return {
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      phoneNumber: payload.phoneNumber,
      permissions: payload.permissions ?? null,
      sid: payload.sid,
    };
  }
}
