import { EntityId, TenantId } from '@abms/kernel';
import { AttendanceRecord } from '@abms/hr-leave-attendance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { AttendanceRecordOrmEntity } from '../entities/attendance-record-orm.entity';
import { TypeOrmAttendanceRecordRepository } from './typeorm-attendance-record.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<AttendanceRecordOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<AttendanceRecordOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmAttendanceRecordRepository', () => {
  it('findByEmployeeAndDate reconstitutes hoursWorked as a number when present', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      date: '2026-08-01',
      clockInTime: new Date('2026-08-01T08:00:00Z'),
      clockOutTime: new Date('2026-08-01T17:00:00Z'),
      status: 'PRESENT',
      hoursWorked: '9.00',
    } as AttendanceRecordOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmAttendanceRecordRepository(
      manager as unknown as EntityManager,
    ).findByEmployeeAndDate(TENANT_ID, employeeId, new Date('2026-08-01'));

    expect(result?.hoursWorked).toBe(9);
  });

  it('save() upserts the row with hoursWorked as null when not yet clocked out', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const record = AttendanceRecord.clockIn({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-08-01'),
      clockInTime: new Date('2026-08-01T08:00:00Z'),
    });

    await new TypeOrmAttendanceRecordRepository(manager as unknown as EntityManager).save(record);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: record.id.toValue(), hoursWorked: null, status: 'PRESENT' }),
    );
  });
});
