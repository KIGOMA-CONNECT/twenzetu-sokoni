import { EntityId, TenantId } from '@abms/kernel';
import { OrgUnitType } from '@abms/organization-domain';
import type { EntityManager, Repository } from 'typeorm';
import { OrgUnitTypeOrmEntity } from '../entities/org-unit-type-orm.entity';
import { TypeOrmOrgUnitTypeRepository } from './typeorm-org-unit-type.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<OrgUnitTypeOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<OrgUnitTypeOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(
  repository: unknown,
): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

describe('TypeOrmOrgUnitTypeRepository', () => {
  it('findById returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmOrgUnitTypeRepository(
      manager as unknown as EntityManager,
    ).findById(EntityId.create());

    expect(result).toBeNull();
  });

  it('findById reconstitutes a domain OrgUnitType including its allowed parent type ids', async () => {
    const id = EntityId.create();
    const allowedParentId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      code: 'DEPARTMENT',
      name: 'Department',
      description: null,
      isSystemDefined: true,
      isActive: true,
      sortOrder: 3,
    } as OrgUnitTypeOrmEntity);
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValue([{ allowed_parent_type_id: allowedParentId.toValue() }]);

    const result = await new TypeOrmOrgUnitTypeRepository(
      manager as unknown as EntityManager,
    ).findById(id);

    expect(result?.code).toBe('DEPARTMENT');
    expect(result?.allowsParentType(allowedParentId)).toBe(true);
  });

  it('save() upserts the row and resyncs the allowed-parent-type join rows', async () => {
    const allowedParentId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const type = OrgUnitType.create({
      tenantId: TENANT_ID,
      code: 'DEPARTMENT',
      name: 'Department',
      allowedParentTypeIds: [allowedParentId],
    });

    await new TypeOrmOrgUnitTypeRepository(manager as unknown as EntityManager).save(type);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: type.id.toValue(), code: 'DEPARTMENT' }),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM "org_unit_type_allowed_parent"'),
      [type.id.toValue()],
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "org_unit_type_allowed_parent"'),
      [type.id.toValue(), allowedParentId.toValue(), TENANT_ID.value],
    );
  });

  it('findAllByTenant reconstitutes every row for the tenant, ordered by sortOrder', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: EntityId.create().toValue(),
        tenantId: TENANT_ID.value,
        code: 'COMPANY',
        name: 'Company',
        description: null,
        isSystemDefined: true,
        isActive: true,
        sortOrder: 1,
      } as OrgUnitTypeOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmOrgUnitTypeRepository(
      manager as unknown as EntityManager,
    ).findAllByTenant(TENANT_ID);

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID.value },
      order: { sortOrder: 'ASC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('COMPANY');
  });
});
