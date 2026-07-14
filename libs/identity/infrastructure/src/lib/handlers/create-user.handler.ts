import { GlobalUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, Email, ITransactionContext, TenantId } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { CreateUserCommand, CreateUserResult } from '@abms/identity-application';
import { User, UserRole } from '@abms/identity-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ArgonPasswordHasher } from '../password/argon-password-hasher';
import { TypeOrmUserRepository } from '../repositories/typeorm-user.repository';
import { getEntityManager } from './get-entity-manager';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler extends TransactionalCommandHandler<CreateUserCommand, CreateUserResult> {
  public constructor(
    unitOfWork: GlobalUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly passwordHasher: ArgonPasswordHasher,
  ) {
    super(unitOfWork, eventBus);
  }

  protected async handle(command: CreateUserCommand, ctx: ITransactionContext): Promise<CreateUserResult> {
    const manager = getEntityManager(ctx);
    const userRepository = new TypeOrmUserRepository(manager);

    const emailResult = Email.create(command.email);
    if (emailResult.isFailure) {
      throw new BusinessRuleViolationException(emailResult.getError().message);
    }
    const email = emailResult.getValue();

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new BusinessRuleViolationException(`A user with email "${command.email}" already exists.`);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = User.create({
      tenantId: TenantId.create(command.tenantId).getValue(),
      email,
      passwordHash,
      role: command.role as UserRole,
    });
    await userRepository.save(user);

    return { id: user.id.toValue() };
  }
}
