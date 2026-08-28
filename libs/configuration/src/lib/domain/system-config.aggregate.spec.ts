import { EntityId } from '@afri-market/kernel';
import { SystemConfig } from './system-config.aggregate';

describe('SystemConfig.define', () => {
  it('creates a config with defaults', () => {
    const config = SystemConfig.define({
      key: 'max_upload_size',
      value: '100',
    });

    expect(config.key).toBe('max_upload_size');
    expect(config.value).toBe('100');
    expect(config.valueType).toBe('STRING');
    expect(config.scope).toBe('SYSTEM');
    expect(config.isEncrypted).toBe(false);
    expect(config.description).toBeUndefined();
    expect(config.category).toBeUndefined();
  });

  it('accepts optional properties', () => {
    const config = SystemConfig.define({
      key: 'api_secret',
      value: 'abc123',
      valueType: 'SECRET',
      description: 'API secret key',
      scope: 'TENANT',
      isEncrypted: true,
      category: 'security',
    });

    expect(config.valueType).toBe('SECRET');
    expect(config.description).toBe('API secret key');
    expect(config.scope).toBe('TENANT');
    expect(config.isEncrypted).toBe(true);
    expect(config.category).toBe('security');
  });

  it('rejects empty key', () => {
    expect(() => SystemConfig.define({ key: '', value: '100' })).toThrow();
  });

  it('rejects empty value', () => {
    expect(() => SystemConfig.define({ key: 'k', value: '' })).toThrow();
  });
});

describe('SystemConfig mutators', () => {
  it('updateValue() changes the value', () => {
    const config = SystemConfig.define({ key: 'k', value: 'old' });
    config.updateValue('new');
    expect(config.value).toBe('new');
  });

  it('updateValue() rejects empty string', () => {
    const config = SystemConfig.define({ key: 'k', value: 'old' });
    expect(() => config.updateValue('')).toThrow();
  });

  it('updateDescription() changes the description', () => {
    const config = SystemConfig.define({ key: 'k', value: 'v' });
    config.updateDescription('new desc');
    expect(config.description).toBe('new desc');
  });

  it('getValueAs<T>() parses typed values', () => {
    const boolConfig = SystemConfig.define({ key: 'b', value: 'true', valueType: 'BOOLEAN' });
    expect(boolConfig.getValueAs<boolean>()).toBe(true);

    const numConfig = SystemConfig.define({ key: 'n', value: '42', valueType: 'NUMBER' });
    expect(numConfig.getValueAs<number>()).toBe(42);

    const jsonConfig = SystemConfig.define({ key: 'j', value: '{"a":1}', valueType: 'JSON' });
    expect(jsonConfig.getValueAs<{ a: number }>()).toEqual({ a: 1 });

    const strConfig = SystemConfig.define({ key: 's', value: 'hello', valueType: 'STRING' });
    expect(strConfig.getValueAs<string>()).toBe('hello');
  });
});

describe('SystemConfig.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const config = SystemConfig.reconstitute({
      id,
      key: 'max_upload',
      value: '200',
      valueType: 'NUMBER',
      scope: 'TENANT',
      isEncrypted: false,
      category: 'upload',
    });

    expect(config.id.equals(id)).toBe(true);
    expect(config.key).toBe('max_upload');
    expect(config.value).toBe('200');
    expect(config.valueType).toBe('NUMBER');
  });
});
