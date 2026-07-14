import { CommandBusAdapter } from '@abms/cqrs';
import {
  CreateUserCommand,
  CreateUserResult,
  LoginCommand,
  LoginResult,
  RegisterTenantCommand,
  RegisterTenantResult,
} from '@abms/identity-application';
import {
  AuthenticatedRequestUser,
  Roles,
  RolesGuard,
} from '@abms/identity-infrastructure';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Controller('auth')
export class AuthController {
  public constructor(private readonly commandBus: CommandBusAdapter) {}

  @Post('register-tenant')
  public registerTenant(@Body() dto: RegisterTenantDto): Promise<RegisterTenantResult> {
    return this.commandBus.execute(
      new RegisterTenantCommand(dto.businessName, dto.ceoEmail, dto.ceoPassword),
    );
  }

  @Post('login')
  public login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.commandBus.execute(new LoginCommand(dto.email, dto.password));
  }

  @Post('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CEO')
  public createUser(
    @Req() request: Request & { user: AuthenticatedRequestUser },
    @Body() dto: CreateUserDto,
  ): Promise<CreateUserResult> {
    return this.commandBus.execute(
      new CreateUserCommand(request.user.tenantId, dto.email, dto.password, dto.role),
    );
  }
}
