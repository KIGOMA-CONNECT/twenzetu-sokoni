import { EntityId, TenantId } from '@abms/kernel';
import { LeaveRequest } from '@abms/hr-leave-attendance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { LeaveRequestOrmEntity } from '../entities/leave-request-orm.entity';
import { TypeOrmLeaveRequestRepository } from './typeorm-leave-request.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<LeaveRequestOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<LeaveRequestOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmLeaveRequestRepository', () => {
  it('findById reconstitutes numberOfDays as a number', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const leaveTypeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      leaveTypeId: leaveTypeId.toValue(),
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      numberOfDays: '5.0',
      reason: null,
      status: 'PENDING',
      decidedByUserId: null,
      decidedAt: null,
      comment: null,
      version: 1,
    } as LeaveRequestOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmLeaveRequestRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.numberOfDays).toBe(5);
    expect(result?.status).toBe('PENDING');
  });

  it('save() upserts the row with numberOfDays as a string', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const request = LeaveRequest.submit({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      leaveTypeId: EntityId.create(),
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-05'),
      numberOfDays: 5,
      reason: null,
    });

    await new TypeOrmLeaveRequestRepository(manager as unknown as EntityManager).save(request);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: request.id.toValue(), numberOfDays: '5', status: 'PENDING' }),
    );
  });
});
