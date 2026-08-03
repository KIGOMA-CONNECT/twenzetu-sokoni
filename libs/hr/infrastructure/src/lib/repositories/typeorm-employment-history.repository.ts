import { EntityId, TenantId } from '@abms/kernel';
import { EmploymentEventType, EmploymentHistoryEntry, IEmploymentHistoryRepository } from '@abms/hr-domain';
import { EntityManager } from 'typeorm';
import { EmploymentHistoryOrmEntity } from '../entities/employment-history-orm.entity';

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class TypeOrmEmploymentHistoryRepository implements IEmploymentHistoryRepository {
  private readonly repository;

  public constructor(manager: EntityManager) {
    this.repository = manager.getRepository(EmploymentHistoryOrmEntity);
  }

  public async append(entry: EmploymentHistoryEntry): Promise<void> {
    await this.repository.insert({
      id: entry.id.toValue(),
      tenantId: entry.tenantId.value,
      employeeId: entry.employeeId.toValue(),
      eventType: entry.eventType,
      effectiveDate: toDateOnly(entry.effectiveDate),
      details: entry.details,
    });
  }

  public async findByEmployeeId(tenantId: TenantId, employeeId: EntityId): Promise<EmploymentHistoryEntry[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) =>
      EmploymentHistoryEntry.reconstitute({
        id: EntityId.create(row.id),
        tenantId: TenantId.create(row.tenantId).getValue(),
        employeeId: EntityId.create(row.employeeId),
        eventType: row.eventType as EmploymentEventType,
        effectiveDate: new Date(row.effectiveDate),
        details: row.details,
      }),
    );
  }
}
