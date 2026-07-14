import { AppConfigService } from '@abms/core-config';
import { EntityId } from '@abms/kernel';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TypeOrmUserRepository } from '../repositories/typeorm-user.repository';
import { AuthenticatedRequestUser, JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  public constructor(
    config: AppConfigService,
    private readonly dataSource: DataSource,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.auth.jwtSecret,
    });
  }

  public async validate(payload: JwtPayload): Promise<AuthenticatedRequestUser> {
    const userRepository = new TypeOrmUserRepository(this.dataSource.manager);
    const user = await userRepository.findById(EntityId.create(payload.sub));

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive.');
    }

    return {
      userId: user.id.toValue(),
      tenantId: user.tenantId.value,
      role: user.role,
      email: user.email.value,
    };
  }
}
