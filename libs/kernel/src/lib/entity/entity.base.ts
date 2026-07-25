import { EntityId } from '../identity/entity-id';
import { Identifier } from '../identity/identifier.base';

export abstract class Entity<TId extends Identifier<unknown> = EntityId> {
  protected readonly _id: TId;

  protected constructor(id: TId) {
    this._id = id;
  }

  public get id(): TId {
    return this._id;
  }

  public equals(other?: Entity<TId> | null): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    if (!(other instanceof Entity)) return false;
    return this._id.equals(other._id);
  }
}
