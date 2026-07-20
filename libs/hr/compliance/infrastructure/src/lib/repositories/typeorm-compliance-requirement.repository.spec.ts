import { EntityId, TenantId } from '@abms/kernel';
import { ComplianceRequirement } from '@abms/hr-compliance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { ComplianceRequirementOrmEntity } from '../entities/compliance-requirement-orm.entity';
import { TypeOrmComplianceRequirementRepository } from './typeorm-compliance-requirement.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<ComplianceRequirementOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<ComplianceRequirementOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmComplianceRequirementRepository', () => {
  it('findAllByTenant reconstitutes domain ComplianceRequirements', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: id.toValue(),
        tenantId: TENANT_ID.value,
        name: 'Annual Fire Safety Certification',
        description: null,
        category: 'SAFETY',
        recurrence: 'ANNUAL',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ComplianceRequirementOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmComplianceRequirementRepository(
      manager as unknown as EntityManager,
    ).findAllByTenant(TENANT_ID);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Annual Fire Safety Certification');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const requirement = ComplianceRequirement.create({
      tenantId: TENANT_ID,
      name: 'Annual Fire Safety Certification',
      description: null,
      category: 'SAFETY',
      recurrence: 'ANNUAL',
    });

    await new TypeOrmComplianceRequirementRepository(manager as unknown as EntityManager).save(requirement);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: requirement.id.toValue(), name: 'Annual Fire Safety Certification' }),
    );
  });
});
