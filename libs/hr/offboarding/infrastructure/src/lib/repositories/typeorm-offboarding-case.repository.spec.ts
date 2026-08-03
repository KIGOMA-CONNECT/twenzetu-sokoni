import { EntityId, TenantId } from '@abms/kernel';
import { OffboardingCase } from '@abms/hr-offboarding-domain';
import type { EntityManager, Repository } from 'typeorm';
import { OffboardingCaseOrmEntity } from '../entities/offboarding-case-orm.entity';
import { TypeOrmOffboardingCaseRepository } from './typeorm-offboarding-case.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<OffboardingCaseOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<OffboardingCaseOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmOffboardingCaseRepository', () => {
  it('findActiveByEmployee reconstitutes a domain OffboardingCase', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      exitReason: 'RESIGNATION',
      lastWorkingDay: '2026-08-15',
      status: 'INITIATED',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as OffboardingCaseOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmOffboardingCaseRepository(
      manager as unknown as EntityManager,
    ).findActiveByEmployee(TENANT_ID, employeeId);

    expect(result?.status).toBe('INITIATED');
    expect(result?.exitReason).toBe('RESIGNATION');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const offboardingCase = OffboardingCase.initiate({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      exitReason: 'RESIGNATION',
      lastWorkingDay: new Date('2026-08-15'),
    });

    await new TypeOrmOffboardingCaseRepository(manager as unknown as EntityManager).save(offboardingCase);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: offboardingCase.id.toValue(), status: 'INITIATED' }),
    );
  });
});
