import { Identifier } from './identifier.base';
import { EntityId } from './entity-id';

describe('EntityId', () => {
  it('generates a valid UUID when created without a value', () => {
    const id = EntityId.create();

    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('accepts an explicit value via from', () => {
    const value = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    const id = EntityId.from(value);

    expect(id.value).toBe(value);
  });

  it('rejects an empty value', () => {
    expect(() => EntityId.from('')).toThrow('EntityId cannot be created from empty string');
    expect(() => EntityId.from('   ')).toThrow('EntityId cannot be created from empty string');
  });

  it('two ids with the same value are equal', () => {
    const value = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    expect(EntityId.from(value).equals(EntityId.from(value))).toBe(true);
  });

  it('two distinct ids are not equal', () => {
    expect(EntityId.create().equals(EntityId.create())).toBe(false);
  });

  it('is not equal to null or undefined', () => {
    const id = EntityId.create();

    expect(id.equals(null as unknown as Identifier<string>)).toBe(false);
    expect(id.equals(undefined)).toBe(false);
  });

  it('stringifies to its raw value', () => {
    const value = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    expect(EntityId.from(value).toString()).toBe(value);
  });
});
