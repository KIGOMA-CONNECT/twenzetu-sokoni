import { TypeOrmRepository } from '@abms/database';
import { Email, EntityId, TenantId } from '@abms/kernel';
import {
  Employee,
  EmployeeGender,
  EmployeeStatus,
  EmploymentType,
  IEmployeeRepository,
} from '@abms/hr-domain';
import { EntityManager } from 'typeorm';
import { EmployeeOrmEntity } from '../entities/employee-orm.entity';

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class TypeOrmEmployeeRepository
  extends TypeOrmRepository<Employee, EmployeeOrmEntity, EntityId>
  implements IEmployeeRepository
{
  public constructor(manager: EntityManager) {
    super(manager, EmployeeOrmEntity);
  }

  public async findById(id: EntityId): Promise<Employee | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmployeeNumber(tenantId: TenantId, employeeNumber: string): Promise<Employee | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, employeeNumber } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmail(tenantId: TenantId, email: Email): Promise<Employee | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, email: email.value } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<Employee[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Employee): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      userId: entity.userId,
      employeeNumber: entity.employeeNumber,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email.value,
      phone: entity.phone,
      dateOfBirth: entity.dateOfBirth ? toDateOnly(entity.dateOfBirth) : null,
      gender: entity.gender,
      positionId: entity.positionId?.toValue() ?? null,
      orgUnitId: entity.orgUnitId,
      hireDate: toDateOnly(entity.hireDate),
      employmentType: entity.employmentType,
      status: entity.status,
      terminationDate: entity.terminationDate ? toDateOnly(entity.terminationDate) : null,
      version: entity.version,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: EmployeeOrmEntity): Employee {
    return Employee.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      userId: row.userId,
      employeeNumber: row.employeeNumber,
      firstName: row.firstName,
      lastName: row.lastName,
      email: Email.create(row.email).getValue(),
      phone: row.phone,
      dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
      gender: row.gender as EmployeeGender | null,
      positionId: row.positionId ? EntityId.create(row.positionId) : null,
      orgUnitId: row.orgUnitId,
      hireDate: new Date(row.hireDate),
      employmentType: row.employmentType as EmploymentType,
      status: row.status as EmployeeStatus,
      terminationDate: row.terminationDate ? new Date(row.terminationDate) : null,
      version: row.version,
    });
  }
}
