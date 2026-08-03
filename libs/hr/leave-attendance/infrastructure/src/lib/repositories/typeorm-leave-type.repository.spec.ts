import { EntityId, TenantId } from '@abms/kernel';
import { LeaveType } from '@abms/hr-leave-attendance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { LeaveTypeOrmEntity } from '../entities/leave-type-orm.entity';
import { TypeOrmLeaveTypeRepository } from './typeorm-leave-type.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<LeaveTypeOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<LeaveTypeOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmLeaveTypeRepository', () => {
  it('findByCode reconstitutes a domain LeaveType, converting numeric string to number', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      code: 'ANNUAL',
      name: 'Annual Leave',
      defaultDaysPerYear: '21.0',
      requiresApproval: true,
      isActive: true,
    } as LeaveTypeOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmLeaveTypeRepository(manager as unknown as EntityManager).findByCode(
      TENANT_ID,
      'ANNUAL',
    );

    expect(result?.defaultDaysPerYear).toBe(21);
  });

  it('save() upserts the row with defaultDaysPerYear as a string', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const leaveType = LeaveType.create({
      tenantId: TENANT_ID,
      code: 'ANNUAL',
      name: 'Annual Leave',
      defaultDaysPerYear: 21,
      requiresApproval: true,
    });

    await new TypeOrmLeaveTypeRepository(manager as unknown as EntityManager).save(leaveType);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: leaveType.id.toValue(), defaultDaysPerYear: '21' }),
    );
  });
});
