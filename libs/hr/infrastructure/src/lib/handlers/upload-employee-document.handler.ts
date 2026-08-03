import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { UploadEmployeeDocumentCommand, UploadEmployeeDocumentResult } from '@abms/hr-application';
import { EmployeeDocument } from '@abms/hr-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmEmployeeDocumentRepository } from '../repositories/typeorm-employee-document.repository';
import { TypeOrmEmployeeRepository } from '../repositories/typeorm-employee.repository';

@Injectable()
@CommandHandler(UploadEmployeeDocumentCommand)
export class UploadEmployeeDocumentHandler extends TransactionalCommandHandler<
  UploadEmployeeDocumentCommand,
  UploadEmployeeDocumentResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) private readonly currentUserProvider: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUserProvider, auditLogger);
  }

  protected async handle(
    command: UploadEmployeeDocumentCommand,
    ctx: ITransactionContext,
  ): Promise<UploadEmployeeDocumentResult> {
    const manager = getEntityManager(ctx);
    const employeeRepository = new TypeOrmEmployeeRepository(manager);
    const documentRepository = new TypeOrmEmployeeDocumentRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const employeeId = EntityId.create(command.employeeId);
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundDomainException('Employee', command.employeeId);
    }

    const uploadedByUserId = this.currentUserProvider.getCurrentUserId() ?? 'unknown';
    const document = EmployeeDocument.create({
      tenantId,
      employeeId: employee.id,
      documentType: command.documentType,
      fileName: command.fileName,
      fileUrl: command.fileUrl,
      uploadedByUserId,
    });

    await documentRepository.save(document);

    return { id: document.id.toValue() };
  }
}
