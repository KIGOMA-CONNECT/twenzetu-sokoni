import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AiVerificationService } from './verification.service';
import { IDENTITY_ENTITIES } from '@afri-market/identity-infrastructure';
import { IDENTITY_REPOSITORIES } from '@afri-market/identity-infrastructure';
import { JwtStrategy } from '@afri-market/identity-infrastructure';
import { ArgonPasswordHasher } from '@afri-market/identity-infrastructure';
import { OtpCacheService } from '@afri-market/identity-infrastructure';
import { SessionService } from '@afri-market/identity-infrastructure';
import { AppConfigService } from '@afri-market/core-config';
import { SmsService, EmailService } from '@afri-market/integrations';
import { AppLoggerService } from '@afri-market/core-logger';

@Module({
  imports: [
    TypeOrmModule.forFeature(IDENTITY_ENTITIES),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (config: AppConfigService): JwtModuleOptions => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiry as unknown as number },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AiVerificationService,
    JwtStrategy,
    OtpCacheService,
    SessionService,
    { provide: 'IPasswordHasher', useClass: ArgonPasswordHasher },
    ...IDENTITY_REPOSITORIES,
    SmsService,
    EmailService,
    AppLoggerService,
  ],
  exports: [AuthService, SessionService, OtpCacheService, JwtModule, ...IDENTITY_REPOSITORIES],
})
export class IdentityModule {}
