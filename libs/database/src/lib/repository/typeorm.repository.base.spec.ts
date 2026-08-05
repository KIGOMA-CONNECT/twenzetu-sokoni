import { AggregateRoot, EntityId } from '@afri-market/kernel';
import type { EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { TypeOrmRepository } from './typeorm.repository.base';

class TestOrmEntity implements ObjectLiteral {
  public id!: string;
}

class TestAggregate extends AggregateRoot {
  public constructor(id: EntityId) {
    super(id);
  }
}

class TestRepository extends TypeOrmRepository<TestAggregate, TestOrmEntity> {
  public constructor(manager: EntityManager) {
    super(manager, TestOrmEntity);
  }

  public async findById(): Promise<TestAggregate | null> {
    return null;
  }

  public async save(): Promise<void> {
    return undefined;
  }

  public async delete(): Promise<void> {
    return undefined;
  }

  public async exists(): Promise<boolean> {
    return false;
  }
}

describe('TypeOrmRepository', () => {
  it('resolves its underlying TypeORM repository from the given manager and entity target', () => {
    const ormRepository = {} as Repository<TestOrmEntity>;
    const getRepository = jest.fn().mockReturnValue(ormRepository);
    const manager = { getRepository } as unknown as EntityManager;

    new TestRepository(manager);

    expect(getRepository).toHaveBeenCalledWith(TestOrmEntity);
  });
});
