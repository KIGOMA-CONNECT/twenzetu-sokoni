import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { ILeaveRequestRepository, LeaveRequest, LeaveRequestStatus } from '@abms/hr-leave-attendance-domain';
import { EntityManager } from 'typeorm';
import { LeaveRequestOrmEntity } from '../entities/leave-request-orm.entity';

export class TypeOrmLeaveRequestRepository
  extends TypeOrmRepository<LeaveRequest, LeaveRequestOrmEntity, EntityId>
  implements ILeaveRequestRepository
{
  public constructor(manager: EntityManager) {
    super(manager, LeaveRequestOrmEntity);
  }

  public async findById(id: EntityId): Promise<LeaveRequest | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<LeaveRequest[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: LeaveRequest): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      leaveTypeId: entity.leaveTypeId.toValue(),
      startDate: this.toDateOnly(entity.startDate),
      endDate: this.toDateOnly(entity.endDate),
      numberOfDays: entity.numberOfDays.toString(),
      reason: entity.reason,
      status: entity.status,
      decidedByUserId: entity.decidedByUserId,
      decidedAt: entity.decidedAt,
      comment: entity.comment,
      version: entity.version,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toDomain(row: LeaveRequestOrmEntity): LeaveRequest {
    return LeaveRequest.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      leaveTypeId: EntityId.create(row.leaveTypeId),
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
      numberOfDays: Number(row.numberOfDays),
      reason: row.reason,
      status: row.status as LeaveRequestStatus,
      decidedByUserId: row.decidedByUserId,
      decidedAt: row.decidedAt,
      comment: row.comment,
      version: row.version,
    });
  }
}
