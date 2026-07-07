import { AggregateRoot } from '../entity/aggregate-root.base';
import { EntityId } from '../identity/entity-id';
import { Identifier } from '../identity/identifier.base';

export interface IRepository<
  TAggregate extends AggregateRoot<TId>,
  TId extends Identifier<unknown> = EntityId,
> {
  findById(id: TId): Promise<TAggregate | null>;
  save(entity: TAggregate): Promise<void>;
  delete(id: TId): Promise<void>;
  exists(id: TId): Promise<boolean>;
}
