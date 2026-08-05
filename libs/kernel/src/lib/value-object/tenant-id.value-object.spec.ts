import { TenantId } from './tenant-id.value-object';

describe('TenantId', () => {
  it('creates from a valid value', () => {
    const tenantId = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301');

    expect(tenantId.value).toBe('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
  });

  it('throws for an empty value', () => {
    expect(() => TenantId.create('')).toThrow('TenantId cannot be empty');
    expect(() => TenantId.create('   ')).toThrow('TenantId cannot be empty');
  });

  it('trims surrounding whitespace', () => {
    expect(TenantId.create('  acme  ').value).toBe('acme');
  });

  it('two tenant ids with the same value are equal', () => {
    const value = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    expect(TenantId.create(value).equals(TenantId.create(value))).toBe(true);
  });

  it('two tenant ids with different values are not equal', () => {
    expect(TenantId.create('acme').equals(TenantId.create('other'))).toBe(false);
  });
});
