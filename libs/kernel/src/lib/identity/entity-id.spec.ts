import { ValidationDomainException } from '../errors/validation-domain.exception';
import { EntityId } from './entity-id';

describe('EntityId', () => {
  it('generates a valid UUID when created without a value', () => {
    const id = EntityId.create();

    expect(id.toValue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('accepts an explicit valid UUID', () => {
    const value = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    const id = EntityId.create(value);

    expect(id.toValue()).toBe(value);
  });

  it('rejects an invalid UUID', () => {
    expect(() => EntityId.create('not-a-uuid')).toThrow(ValidationDomainException);
  });

  it('two ids with the same value are equal', () => {
    const value = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    expect(EntityId.create(value).equals(EntityId.create(value))).toBe(true);
  });

  it('two distinct ids are not equal', () => {
    expect(EntityId.create().equals(EntityId.create())).toBe(false);
  });

  it('is not equal to null or undefined', () => {
    const id = EntityId.create();

    expect(id.equals(null)).toBe(false);
    expect(id.equals(undefined)).toBe(false);
  });
});
