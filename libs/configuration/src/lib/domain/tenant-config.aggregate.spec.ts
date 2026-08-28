import { EntityId } from '@afri-market/kernel';
import { TenantConfig } from './tenant-config.aggregate';

describe('TenantConfig.define', () => {
  it('creates a tenant config with STRING type', () => {
    const config = TenantConfig.define({
      tenantId: 'tenant-1',
      key: 'theme',
      value: 'dark',
    });

    expect(config.tenantId).toBe('tenant-1');
    expect(config.key).toBe('theme');
    expect(config.value).toBe('dark');
    expect(config.valueType).toBe('STRING');
    expect(config.description).toBeUndefined();
    expect(config.category).toBeUndefined();
  });

  it('accepts optional properties', () => {
    const config = TenantConfig.define({
      tenantId: 'tenant-1',
      key: 'max_items',
      value: '50',
      valueType: 'NUMBER',
      description: 'Max items per page',
      category: 'pagination',
    });

    expect(config.valueType).toBe('NUMBER');
    expect(config.description).toBe('Max items per page');
    expect(config.category).toBe('pagination');
  });

  it('rejects empty tenantId', () => {
    expect(() =>
      TenantConfig.define({ tenantId: '', key: 'k', value: 'v' })
    ).toThrow();
  });

  it('rejects empty key', () => {
    expect(() =>
      TenantConfig.define({ tenantId: 't', key: '', value: 'v' })
    ).toThrow();
  });

  it('rejects empty value', () => {
    expect(() =>
      TenantConfig.define({ tenantId: 't', key: 'k', value: '' })
    ).toThrow();
  });
});

describe('TenantConfig mutators', () => {
  it('updateValue() changes the value', () => {
    const config = TenantConfig.define({ tenantId: 't', key: 'k', value: 'old' });
    config.updateValue('new');
    expect(config.value).toBe('new');
  });

  it('updateValue() rejects empty string', () => {
    const config = TenantConfig.define({ tenantId: 't', key: 'k', value: 'old' });
    expect(() => config.updateValue('')).toThrow();
  });

  it('getValueAs<T>() parses typed values', () => {
    const boolConfig = TenantConfig.define({ tenantId: 't', key: 'b', value: 'false', valueType: 'BOOLEAN' });
    expect(boolConfig.getValueAs<boolean>()).toBe(false);

    const numConfig = TenantConfig.define({ tenantId: 't', key: 'n', value: '99', valueType: 'NUMBER' });
    expect(numConfig.getValueAs<number>()).toBe(99);

    const jsonConfig = TenantConfig.define({ tenantId: 't', key: 'j', value: '{"x":1}', valueType: 'JSON' });
    expect(jsonConfig.getValueAs<{ x: number }>()).toEqual({ x: 1 });
  });
});

describe('TenantConfig.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const config = TenantConfig.reconstitute({
      id,
      tenantId: 'tenant-1',
      key: 'theme',
      value: 'dark',
      valueType: 'STRING',
      description: 'Theme color',
      category: 'ui',
    });

    expect(config.id.equals(id)).toBe(true);
    expect(config.tenantId).toBe('tenant-1');
    expect(config.description).toBe('Theme color');
  });
});
