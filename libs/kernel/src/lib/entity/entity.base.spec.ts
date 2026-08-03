import { EntityId } from '../identity/entity-id';
import { Entity } from './entity.base';

class TestEntity extends Entity {
  public constructor(
    id: EntityId,
    public readonly name: string,
  ) {
    super(id);
  }
}

describe('Entity', () => {
  it('exposes its identifier', () => {
    const id = EntityId.create();
    const entity = new TestEntity(id, 'Acme Ltd');

    expect(entity.id).toBe(id);
  });

  it('is equal to itself', () => {
    const entity = new TestEntity(EntityId.create(), 'Acme Ltd');

    expect(entity.equals(entity)).toBe(true);
  });

  it('two entities with the same id are equal, even with different attributes', () => {
    const id = EntityId.create();
    const a = new TestEntity(id, 'Acme Ltd');
    const b = new TestEntity(id, 'A different name');

    expect(a.equals(b)).toBe(true);
  });

  it('two entities with different ids are not equal', () => {
    const a = new TestEntity(EntityId.create(), 'Acme Ltd');
    const b = new TestEntity(EntityId.create(), 'Acme Ltd');

    expect(a.equals(b)).toBe(false);
  });

  it('is not equal to null or undefined', () => {
    const entity = new TestEntity(EntityId.create(), 'Acme Ltd');

    expect(entity.equals(null)).toBe(false);
    expect(entity.equals(undefined)).toBe(false);
  });
});
