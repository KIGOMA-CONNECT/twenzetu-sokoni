import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  AttendanceRecord,
  AttendanceStatus,
  IAttendanceRecordRepository,
} from '@abms/hr-leave-attendance-domain';
import { Between, EntityManager } from 'typeorm';
import { AttendanceRecordOrmEntity } from '../entities/attendance-record-orm.entity';

export class TypeOrmAttendanceRecordRepository
  extends TypeOrmRepository<AttendanceRecord, AttendanceRecordOrmEntity, EntityId>
  implements IAttendanceRecordRepository
{
  public constructor(manager: EntityManager) {
    super(manager, AttendanceRecordOrmEntity);
  }

  public async findById(id: EntityId): Promise<AttendanceRecord | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmployeeAndDate(
    tenantId: TenantId,
    employeeId: EntityId,
    date: Date,
  ): Promise<AttendanceRecord | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        date: this.toDateOnly(date),
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmployeeAndDateRange(
    tenantId: TenantId,
    employeeId: EntityId,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceRecord[]> {
    const rows = await this.repository.find({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        date: Between(this.toDateOnly(startDate), this.toDateOnly(endDate)),
      },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: AttendanceRecord): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      date: this.toDateOnly(entity.date),
      clockInTime: entity.clockInTime,
      clockOutTime: entity.clockOutTime,
      status: entity.status,
      hoursWorked: entity.hoursWorked === null ? null : entity.hoursWorked.toString(),
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toDomain(row: AttendanceRecordOrmEntity): AttendanceRecord {
    return AttendanceRecord.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      date: new Date(row.date),
      clockInTime: row.clockInTime,
      clockOutTime: row.clockOutTime,
      status: row.status as AttendanceStatus,
      hoursWorked: row.hoursWorked === null ? null : Number(row.hoursWorked),
    });
  }
}
