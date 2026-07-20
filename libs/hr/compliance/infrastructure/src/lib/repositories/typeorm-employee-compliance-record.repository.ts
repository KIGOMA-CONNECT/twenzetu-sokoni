import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  ComplianceRecordStatus,
  EmployeeComplianceRecord,
  IEmployeeComplianceRecordRepository,
} from '@abms/hr-compliance-domain';
import { EntityManager } from 'typeorm';
import { EmployeeComplianceRecordOrmEntity } from '../entities/employee-compliance-record-orm.entity';

export class TypeOrmEmployeeComplianceRecordRepository
  extends TypeOrmRepository<EmployeeComplianceRecord, EmployeeComplianceRecordOrmEntity, EntityId>
  implements IEmployeeComplianceRecordRepository
{
  public constructor(manager: EntityManager) {
    super(manager, EmployeeComplianceRecordOrmEntity);
  }

  public async findById(id: EntityId): Promise<EmployeeComplianceRecord | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findPendingByEmployeeAndRequirement(
    tenantId: TenantId,
    employeeId: EntityId,
    complianceRequirementId: EntityId,
  ): Promise<EmployeeComplianceRecord | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        complianceRequirementId: complianceRequirementId.toValue(),
        status: 'PENDING',
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<EmployeeComplianceRecord[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async findAllByRequirement(
    tenantId: TenantId,
    complianceRequirementId: EntityId,
  ): Promise<EmployeeComplianceRecord[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, complianceRequirementId: complianceRequirementId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: EmployeeComplianceRecord): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      complianceRequirementId: entity.complianceRequirementId.toValue(),
      dueDate: entity.dueDate.toISOString().slice(0, 10),
      status: entity.status,
      completedDate: entity.completedDate ? entity.completedDate.toISOString().slice(0, 10) : null,
      exemptionReason: entity.exemptionReason,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: EmployeeComplianceRecordOrmEntity): EmployeeComplianceRecord {
    return EmployeeComplianceRecord.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      complianceRequirementId: EntityId.create(row.complianceRequirementId),
      dueDate: new Date(row.dueDate),
      status: row.status as ComplianceRecordStatus,
      completedDate: row.completedDate ? new Date(row.completedDate) : null,
      exemptionReason: row.exemptionReason,
    });
  }
}
