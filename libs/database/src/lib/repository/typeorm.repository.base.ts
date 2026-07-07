import { AggregateRoot, EntityId, Identifier, IRepository } from '@abms/kernel';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

export abstract class TypeOrmRepository<
  TAggregate extends AggregateRoot<TId>,
  TEntity extends ObjectLiteral,
  TId extends Identifier<unknown> = EntityId,
> implements IRepository<TAggregate, TId>
{
  protected readonly repository: Repository<TEntity>;

  protected constructor(manager: EntityManager, entityTarget: new () => TEntity) {
    this.repository = manager.getRepository(entityTarget);
  }

  public abstract findById(id: TId): Promise<TAggregate | null>;
  public abstract save(entity: TAggregate): Promise<void>;
  public abstract delete(id: TId): Promise<void>;
  public abstract exists(id: TId): Promise<boolean>;
}
