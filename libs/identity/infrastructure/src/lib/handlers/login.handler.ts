import { GlobalUnitOfWork } from '@abms/database';
import { Email, ITransactionContext } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { LoginCommand, LoginResult } from '@abms/identity-application';
import { AuthenticationFailedException } from '@abms/identity-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ArgonPasswordHasher } from '../password/argon-password-hasher';
import { TypeOrmUserRepository } from '../repositories/typeorm-user.repository';
import { getEntityManager } from './get-entity-manager';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler extends TransactionalCommandHandler<LoginCommand, LoginResult> {
  public constructor(
    unitOfWork: GlobalUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly passwordHasher: ArgonPasswordHasher,
    private readonly jwtService: JwtService,
  ) {
    super(unitOfWork, eventBus);
  }

  protected async handle(command: LoginCommand, ctx: ITransactionContext): Promise<LoginResult> {
    const manager = getEntityManager(ctx);
    const userRepository = new TypeOrmUserRepository(manager);

    // Same generic error for "no such user" and "wrong password" — avoids
    // leaking which emails are registered.
    const invalidCredentials = () =>
      new AuthenticationFailedException('Invalid email or password.');

    const emailResult = Email.create(command.email);
    if (emailResult.isFailure) {
      throw invalidCredentials();
    }

    const user = await userRepository.findByEmail(emailResult.getValue());
    if (!user || !user.isActive) {
      throw invalidCredentials();
    }

    const passwordMatches = await this.passwordHasher.verify(user.passwordHash, command.password);
    if (!passwordMatches) {
      throw invalidCredentials();
    }

    const payload: JwtPayload = {
      sub: user.id.toValue(),
      tenantId: user.tenantId.value,
      role: user.role,
      email: user.email.value,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      userId: user.id.toValue(),
      tenantId: user.tenantId.value,
      role: user.role,
    };
  }
}
