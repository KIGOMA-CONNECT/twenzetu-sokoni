import { AppConfigModule, AppConfigService } from '@abms/core-config';
import {
  ArgonPasswordHasher,
  IDENTITY_COMMAND_HANDLERS,
  IDENTITY_QUERY_HANDLERS,
  JwtStrategy,
  RequestCurrentUserProvider,
  RolesGuard,
} from '@abms/identity-infrastructure';
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule,
    // global: true so JwtService is ambiently injectable into JwtTenantResolver,
    // which apps/api's composition root wires into TenancyModule.forRoot() —
    // that dynamic module has no import edge to this one. See ADR-0005.
    JwtModule.registerAsync({
      global: true,
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): JwtModuleOptions => ({
        secret: config.auth.jwtSecret,
        signOptions: { expiresIn: config.auth.jwtExpiresIn as JwtSignOptions['expiresIn'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    ...IDENTITY_COMMAND_HANDLERS,
    ...IDENTITY_QUERY_HANDLERS,
    JwtStrategy,
    RolesGuard,
    ArgonPasswordHasher,
    RequestCurrentUserProvider,
  ],
  exports: [RolesGuard],
})
export class IdentityModule {}
