import { ConcurrencyDomainException, Email, EntityId, TenantId } from '@abms/kernel';
import { User } from '@abms/identity-domain';
import type { EntityManager, Repository } from 'typeorm';
import { UserOrmEntity } from '../entities/user-orm.entity';
import { TypeOrmUserRepository } from './typeorm-user.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const EMAIL = Email.create('ceo@afribiz.co.tz').getValue();

function fakeOrmRepository(): jest.Mocked<Pick<Repository<UserOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<UserOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

function createUser(): User {
  return User.create({ tenantId: TENANT_ID, email: EMAIL, passwordHash: 'hashed', role: 'CEO' });
}

describe('TypeOrmUserRepository', () => {
  it('findByEmail returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmUserRepository(manager as unknown as EntityManager).findByEmail(EMAIL);

    expect(result).toBeNull();
  });

  it('findByEmail reconstitutes a domain User', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      email: EMAIL.value,
      passwordHash: 'hashed',
      role: 'CEO',
      isActive: true,
      version: 1,
    } as UserOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmUserRepository(manager as unknown as EntityManager).findByEmail(EMAIL);

    expect(result?.email.value).toBe(EMAIL.value);
    expect(result?.role).toBe('CEO');
  });

  it('save() inserts a new row when none exists', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValue([{ exists: false }]);
    const user = createUser();

    await new TypeOrmUserRepository(manager as unknown as EntityManager).save(user);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id.toValue(), email: EMAIL.value }),
    );
  });

  it('save() throws ConcurrencyDomainException when the CAS update affects zero rows', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValueOnce([{ exists: true }]).mockResolvedValueOnce([[], 0]);
    const user = createUser();

    await expect(
      new TypeOrmUserRepository(manager as unknown as EntityManager).save(user),
    ).rejects.toBeInstanceOf(ConcurrencyDomainException);
  });
});
