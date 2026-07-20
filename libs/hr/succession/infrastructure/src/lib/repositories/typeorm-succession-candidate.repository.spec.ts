import { EntityId, TenantId } from '@abms/kernel';
import { SuccessionCandidate } from '@abms/hr-succession-domain';
import type { EntityManager, Repository } from 'typeorm';
import { SuccessionCandidateOrmEntity } from '../entities/succession-candidate-orm.entity';
import { TypeOrmSuccessionCandidateRepository } from './typeorm-succession-candidate.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<SuccessionCandidateOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<SuccessionCandidateOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmSuccessionCandidateRepository', () => {
  it('findByPlanAndEmployee reconstitutes a domain SuccessionCandidate', async () => {
    const id = EntityId.create();
    const successionPlanId = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      successionPlanId: successionPlanId.toValue(),
      employeeId: employeeId.toValue(),
      readinessLevel: 'READY_NOW',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SuccessionCandidateOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmSuccessionCandidateRepository(
      manager as unknown as EntityManager,
    ).findByPlanAndEmployee(TENANT_ID, successionPlanId, employeeId);

    expect(result?.readinessLevel).toBe('READY_NOW');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const candidate = SuccessionCandidate.nominate({
      tenantId: TENANT_ID,
      successionPlanId: EntityId.create(),
      employeeId: EntityId.create(),
      readinessLevel: 'READY_3_5_YEARS',
      notes: null,
    });

    await new TypeOrmSuccessionCandidateRepository(manager as unknown as EntityManager).save(candidate);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: candidate.id.toValue(), readinessLevel: 'READY_3_5_YEARS' }),
    );
  });
});
