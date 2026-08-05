import { Email, EntityId, PhoneNumber, TenantId } from '@afri-market/kernel';
import { User } from '@afri-market/identity-domain';
import type { EntityManager, Repository } from 'typeorm';
import { UserOrmEntity } from '../entities/user-orm.entity';
import { TypeOrmUserRepository } from './typeorm-user.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
const EMAIL = Email.create('ceo@afribiz.co.tz');
const PHONE = PhoneNumber.create('+255712345678');

function fakeOrmRepository(): jest.Mocked<Pick<Repository<UserOrmEntity>, 'findOne' | 'count' | 'save' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<UserOrmEntity>, 'findOne' | 'count' | 'save' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

function createUser(): User {
  return User.create({
    tenantId: TENANT_ID,
    phoneNumber: PHONE,
    fullName: 'Afribiz CEO',
    role: 'admin',
    passwordHash: 'hashed',
    email: EMAIL,
  });
}

describe('TypeOrmUserRepository', () => {
  it('findByEmail returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmUserRepository(manager as unknown as EntityManager).findByEmail(
      EMAIL.value,
    );

    expect(result).toBeNull();
  });

  it('findByEmail reconstitutes a domain User', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.value,
      tenantId: TENANT_ID.value,
      phoneNumber: PHONE.value,
      fullName: 'Afribiz CEO',
      email: EMAIL.value,
      passwordHash: 'hashed',
      role: 'admin',
      status: 'ACTIVE',
      version: 1,
      permissions: null,
    } as unknown as UserOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmUserRepository(manager as unknown as EntityManager).findByEmail(
      EMAIL.value,
    );

    expect(result?.email?.value).toBe(EMAIL.value);
    expect(result?.role).toBe('admin');
    expect(result?.status).toBe('ACTIVE');
  });

  it('save() persists the domain user via the ORM repository', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const user = createUser();

    await new TypeOrmUserRepository(manager as unknown as EntityManager).save(user);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id.value,
        email: EMAIL.value,
        phoneNumber: PHONE.value,
      }),
    );
  });
});
