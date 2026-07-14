import { GlobalUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, Email, ITransactionContext, TenantId } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { RegisterTenantCommand, RegisterTenantResult } from '@abms/identity-application';
import { Tenant, User } from '@abms/identity-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ArgonPasswordHasher } from '../password/argon-password-hasher';
import { TypeOrmTenantRepository } from '../repositories/typeorm-tenant.repository';
import { TypeOrmUserRepository } from '../repositories/typeorm-user.repository';
import { getEntityManager } from './get-entity-manager';

@Injectable()
@CommandHandler(RegisterTenantCommand)
export class RegisterTenantHandler extends TransactionalCommandHandler<
  RegisterTenantCommand,
  RegisterTenantResult
> {
  public constructor(
    unitOfWork: GlobalUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly passwordHasher: ArgonPasswordHasher,
  ) {
    super(unitOfWork, eventBus);
  }

  protected async handle(
    command: RegisterTenantCommand,
    ctx: ITransactionContext,
  ): Promise<RegisterTenantResult> {
    const manager = getEntityManager(ctx);
    const tenantRepository = new TypeOrmTenantRepository(manager);
    const userRepository = new TypeOrmUserRepository(manager);

    const emailResult = Email.create(command.ceoEmail);
    if (emailResult.isFailure) {
      throw new BusinessRuleViolationException(emailResult.getError().message);
    }
    const email = emailResult.getValue();

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A user with email "${command.ceoEmail}" already exists.`,
      );
    }

    const tenant = Tenant.create({ name: command.businessName });
    await tenantRepository.save(tenant);

    const passwordHash = await this.passwordHasher.hash(command.ceoPassword);
    const user = User.create({
      tenantId: TenantId.create(tenant.id.toValue()).getValue(),
      email,
      passwordHash,
      role: 'CEO',
    });
    await userRepository.save(user);

    return { tenantId: tenant.id.toValue(), userId: user.id.toValue() };
  }
}
