import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '@afri-market/core-config';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  phoneNumber: string;
  permissions?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  public validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return {
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      phoneNumber: payload.phoneNumber,
      permissions: payload.permissions ?? null,
    };
  }
}
