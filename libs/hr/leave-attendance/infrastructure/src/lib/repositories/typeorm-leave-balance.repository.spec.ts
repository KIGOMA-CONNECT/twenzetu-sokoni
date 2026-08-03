import { EntityId, TenantId } from '@abms/kernel';
import { LeaveBalance } from '@abms/hr-leave-attendance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { LeaveBalanceOrmEntity } from '../entities/leave-balance-orm.entity';
import { TypeOrmLeaveBalanceRepository } from './typeorm-leave-balance.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<LeaveBalanceOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<LeaveBalanceOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmLeaveBalanceRepository', () => {
  it('findByEmployeeLeaveTypeAndYear reconstitutes numeric columns as numbers', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const leaveTypeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      leaveTypeId: leaveTypeId.toValue(),
      year: 2026,
      allocatedDays: '21.0',
      usedDays: '5.0',
    } as LeaveBalanceOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmLeaveBalanceRepository(
      manager as unknown as EntityManager,
    ).findByEmployeeLeaveTypeAndYear(TENANT_ID, employeeId, leaveTypeId, 2026);

    expect(result?.allocatedDays).toBe(21);
    expect(result?.usedDays).toBe(5);
    expect(result?.remainingDays).toBe(16);
  });

  it('save() upserts the row with day counts as strings', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const balance = LeaveBalance.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      leaveTypeId: EntityId.create(),
      year: 2026,
      allocatedDays: 21,
    });

    await new TypeOrmLeaveBalanceRepository(manager as unknown as EntityManager).save(balance);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: balance.id.toValue(), allocatedDays: '21', usedDays: '0' }),
    );
  });
});
