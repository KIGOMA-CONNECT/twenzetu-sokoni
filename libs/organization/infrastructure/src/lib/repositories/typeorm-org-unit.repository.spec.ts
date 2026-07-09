import { ConcurrencyDomainException, EntityId, TenantId } from '@abms/kernel';
import { OrgUnit } from '@abms/organization-domain';
import type { EntityManager, Repository } from 'typeorm';
import { OrgUnitOrmEntity } from '../entities/org-unit-orm.entity';
import { TypeOrmOrgUnitRepository } from './typeorm-org-unit.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<OrgUnitOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<OrgUnitOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

function newOrgUnit(parentId: EntityId | null = null): OrgUnit {
  return OrgUnit.create({
    tenantId: TENANT_ID,
    orgUnitTypeId: EntityId.create(),
    parentId,
    code: 'HQ',
    name: 'Headquarters',
  });
}

describe('TypeOrmOrgUnitRepository', () => {
  describe('wouldCreateCycle', () => {
    it('returns true when the closure table already has ancestor->descendant row', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      manager.query.mockResolvedValue([{ exists: true }]);

      const result = await new TypeOrmOrgUnitRepository(
        manager as unknown as EntityManager,
      ).wouldCreateCycle(EntityId.create(), EntityId.create());

      expect(result).toBe(true);
    });

    it('returns false when no such closure row exists', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      manager.query.mockResolvedValue([{ exists: false }]);

      const result = await new TypeOrmOrgUnitRepository(
        manager as unknown as EntityManager,
      ).wouldCreateCycle(EntityId.create(), EntityId.create());

      expect(result).toBe(false);
    });
  });

  describe('save() — new org unit', () => {
    it('inserts the row and a self-referencing depth-0 closure row', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      manager.query.mockResolvedValueOnce([]); // "does it already exist" check -> no
      const orgUnit = newOrgUnit();

      await new TypeOrmOrgUnitRepository(manager as unknown as EntityManager).save(orgUnit);

      expect(ormRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ id: orgUnit.id.toValue(), code: 'HQ', parentId: null }),
      );
      expect(manager.query).toHaveBeenCalledWith(
        expect.stringContaining('VALUES ($1, $1, 0, $2)'),
        [orgUnit.id.toValue(), TENANT_ID.value],
      );
    });

    it('also copies the parent ancestor chain when created under a parent', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      manager.query.mockResolvedValueOnce([]); // existence check -> no
      const parentId = EntityId.create();
      const orgUnit = newOrgUnit(parentId);

      await new TypeOrmOrgUnitRepository(manager as unknown as EntityManager).save(orgUnit);

      expect(manager.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT "ancestor_id", $1, "depth" + 1, $2'),
        [orgUnit.id.toValue(), TENANT_ID.value, parentId.toValue()],
      );
    });
  });

  describe('save() — existing org unit', () => {
    it('succeeds and bumps version when the version matches', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      manager.query
        .mockResolvedValueOnce([{ parent_id: null }]) // existence check -> found, same parent
        .mockResolvedValueOnce([[], 1]); // UPDATE affected 1 row
      const orgUnit = newOrgUnit();
      orgUnit.rename('Head Office');

      await expect(
        new TypeOrmOrgUnitRepository(manager as unknown as EntityManager).save(orgUnit),
      ).resolves.toBeUndefined();
    });

    it('throws ConcurrencyDomainException when the UPDATE affects zero rows', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      manager.query
        .mockResolvedValueOnce([{ parent_id: null }])
        .mockResolvedValueOnce([[], 0]); // UPDATE affected 0 rows -> lost the race
      const orgUnit = newOrgUnit();
      orgUnit.rename('Head Office');

      await expect(
        new TypeOrmOrgUnitRepository(manager as unknown as EntityManager).save(orgUnit),
      ).rejects.toBeInstanceOf(ConcurrencyDomainException);
    });

    it('runs the closure reparent algorithm when the parent changed', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      const oldParentId = EntityId.create();
      const newParentId = EntityId.create();
      manager.query
        .mockResolvedValueOnce([{ parent_id: oldParentId.toValue() }]) // existence check -> found, different parent
        .mockResolvedValueOnce([]) // DELETE crossing rows
        .mockResolvedValueOnce([]) // INSERT new crossing rows
        .mockResolvedValueOnce([[], 1]); // UPDATE affected 1 row
      const orgUnit = newOrgUnit(oldParentId);
      orgUnit.reparent(newParentId, false);

      await new TypeOrmOrgUnitRepository(manager as unknown as EntityManager).save(orgUnit);

      expect(manager.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('DELETE FROM "org_unit_closure"'),
        [orgUnit.id.toValue()],
      );
      expect(manager.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('CROSS JOIN "org_unit_closure" subtree'),
        [newParentId.toValue(), orgUnit.id.toValue(), TENANT_ID.value],
      );
    });

    it('does not run the closure reparent algorithm when the parent is unchanged', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      manager.query
        .mockResolvedValueOnce([{ parent_id: null }])
        .mockResolvedValueOnce([[], 1]);
      const orgUnit = newOrgUnit();
      orgUnit.rename('Head Office');

      await new TypeOrmOrgUnitRepository(manager as unknown as EntityManager).save(orgUnit);

      expect(manager.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('removes closure rows on both sides before deleting the org unit row', async () => {
      const ormRepository = fakeOrmRepository();
      const manager = fakeManager(ormRepository);
      const id = EntityId.create();

      await new TypeOrmOrgUnitRepository(manager as unknown as EntityManager).delete(id);

      expect(manager.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM "org_unit_closure"'),
        [id.toValue()],
      );
      expect(ormRepository.delete).toHaveBeenCalledWith({ id: id.toValue() });
    });
  });
});
