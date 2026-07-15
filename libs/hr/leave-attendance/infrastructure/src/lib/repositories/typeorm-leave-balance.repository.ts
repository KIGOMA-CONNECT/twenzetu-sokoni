import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { ILeaveBalanceRepository, LeaveBalance } from '@abms/hr-leave-attendance-domain';
import { EntityManager } from 'typeorm';
import { LeaveBalanceOrmEntity } from '../entities/leave-balance-orm.entity';

export class TypeOrmLeaveBalanceRepository
  extends TypeOrmRepository<LeaveBalance, LeaveBalanceOrmEntity, EntityId>
  implements ILeaveBalanceRepository
{
  public constructor(manager: EntityManager) {
    super(manager, LeaveBalanceOrmEntity);
  }

  public async findById(id: EntityId): Promise<LeaveBalance | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmployeeLeaveTypeAndYear(
    tenantId: TenantId,
    employeeId: EntityId,
    leaveTypeId: EntityId,
    year: number,
  ): Promise<LeaveBalance | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        leaveTypeId: leaveTypeId.toValue(),
        year,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(
    tenantId: TenantId,
    employeeId: EntityId,
    year: number,
  ): Promise<LeaveBalance[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue(), year },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: LeaveBalance): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      leaveTypeId: entity.leaveTypeId.toValue(),
      year: entity.year,
      allocatedDays: entity.allocatedDays.toString(),
      usedDays: entity.usedDays.toString(),
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: LeaveBalanceOrmEntity): LeaveBalance {
    return LeaveBalance.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      leaveTypeId: EntityId.create(row.leaveTypeId),
      year: row.year,
      allocatedDays: Number(row.allocatedDays),
      usedDays: Number(row.usedDays),
    });
  }
}
