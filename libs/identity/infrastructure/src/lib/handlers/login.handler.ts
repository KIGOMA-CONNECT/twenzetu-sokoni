import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { GlobalUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { LoginCommand, LoginResult, LoginUserResult } from '@abms/identity-application';
import { AuthenticationFailedException, UserRole } from '@abms/identity-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ArgonPasswordHasher } from '../password/argon-password-hasher';
import { getEntityManager } from './get-entity-manager';

interface UserRow {
  id: string;
  tenant_id: string;
  phone_number: string;
  full_name: string;
  email: string | null;
  password_hash: string;
  role: string;
  status: string;
}

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler extends TransactionalCommandHandler<LoginCommand, LoginResult> {
  public constructor(
    unitOfWork: GlobalUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly passwordHasher: ArgonPasswordHasher,
    private readonly jwtService: JwtService,
    tenantContext: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
  }

  protected async handle(command: LoginCommand, ctx: ITransactionContext): Promise<LoginResult> {
    const manager = getEntityManager(ctx);

    const invalidCredentials = () =>
      new AuthenticationFailedException('Invalid phone number or password.');

    const rows: UserRow[] = await manager.query(
      `SELECT id, tenant_id, phone_number, full_name, COALESCE(email, '') AS email, password_hash, role, status
       FROM users
       WHERE phone_number = $1`,
      [command.phoneNumber],
    );

    const user = rows[0];
    if (!user || user.status !== 'ACTIVE') {
      throw invalidCredentials();
    }

    const passwordMatches = await this.passwordHasher.verify(user.password_hash, command.password);
    if (!passwordMatches) {
      throw invalidCredentials();
    }

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenant_id,
      role: user.role as UserRole,
      email: user.email ?? '',
    };
    const accessToken = this.jwtService.sign(payload);

    const userResult: LoginUserResult = {
      id: user.id,
      tenantId: user.tenant_id,
      phoneNumber: user.phone_number,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
      email: user.email ?? undefined,
    };

    return {
      accessToken,
      user: userResult,
    };
  }
}
