import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { EmployeeDocument, EmployeeDocumentType, IEmployeeDocumentRepository } from '@abms/hr-domain';
import { EntityManager } from 'typeorm';
import { EmployeeDocumentOrmEntity } from '../entities/employee-document-orm.entity';

export class TypeOrmEmployeeDocumentRepository
  extends TypeOrmRepository<EmployeeDocument, EmployeeDocumentOrmEntity, EntityId>
  implements IEmployeeDocumentRepository
{
  public constructor(manager: EntityManager) {
    super(manager, EmployeeDocumentOrmEntity);
  }

  public async findById(id: EntityId): Promise<EmployeeDocument | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmployeeId(tenantId: TenantId, employeeId: EntityId): Promise<EmployeeDocument[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
      order: { uploadedAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: EmployeeDocument): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      documentType: entity.documentType,
      fileName: entity.fileName,
      fileUrl: entity.fileUrl,
      uploadedByUserId: entity.uploadedByUserId,
      uploadedAt: entity.uploadedAt,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: EmployeeDocumentOrmEntity): EmployeeDocument {
    return EmployeeDocument.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      documentType: row.documentType as EmployeeDocumentType,
      fileName: row.fileName,
      fileUrl: row.fileUrl,
      uploadedByUserId: row.uploadedByUserId,
      uploadedAt: row.uploadedAt,
    });
  }
}
