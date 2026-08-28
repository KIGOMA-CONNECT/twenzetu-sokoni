import { EntityId } from '@afri-market/kernel';
import { RegisteredEntity } from './registered-entity.aggregate';

describe('RegisteredEntity.register', () => {
  it('creates a new entity with ACTIVE state and version 1', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John Doe',
      tenantId: 'tenant-1',
    });

    expect(entity.entityType).toBe('Customer');
    expect(entity.entityCategory).toBe('PERSON');
    expect(entity.displayName).toBe('John Doe');
    expect(entity.tenantId).toBe('tenant-1');
    expect(entity.state).toBe('ACTIVE');
    expect(entity.version).toBe(1);
    expect(entity.attributes).toEqual({});
    expect(entity.tags).toEqual([]);
    expect(entity.parentEntityId).toBeUndefined();
  });

  it('accepts optional attributes, tags, and parentEntityId', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Product',
      entityCategory: 'PRODUCT',
      displayName: 'Widget',
      tenantId: 'tenant-1',
      attributes: { sku: 'W001', price: 9.99 },
      tags: ['popular', 'new'],
      parentEntityId: 'parent-uuid',
    });

    expect(entity.attributes).toEqual({ sku: 'W001', price: 9.99 });
    expect(entity.tags).toEqual(['popular', 'new']);
    expect(entity.parentEntityId).toBe('parent-uuid');
  });

  it('rejects empty entityType', () => {
    expect(() =>
      RegisteredEntity.register({
        entityType: '',
        entityCategory: 'PERSON',
        displayName: 'John',
        tenantId: 'tenant-1',
      })
    ).toThrow();
  });

  it('rejects empty displayName', () => {
    expect(() =>
      RegisteredEntity.register({
        entityType: 'Customer',
        entityCategory: 'PERSON',
        displayName: '',
        tenantId: 'tenant-1',
      })
    ).toThrow();
  });

  it('rejects empty tenantId', () => {
    expect(() =>
      RegisteredEntity.register({
        entityType: 'Customer',
        entityCategory: 'PERSON',
        displayName: 'John',
        tenantId: '',
      })
    ).toThrow();
  });
});

describe('RegisteredEntity mutators', () => {
  it('updateDisplayName() changes the name', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John Doe',
      tenantId: 'tenant-1',
    });

    entity.updateDisplayName('Jane Doe');
    expect(entity.displayName).toBe('Jane Doe');
  });

  it('updateDisplayName() rejects empty string', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John Doe',
      tenantId: 'tenant-1',
    });

    expect(() => entity.updateDisplayName('')).toThrow();
  });

  it('setAttribute() and removeAttribute() manage attributes', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John',
      tenantId: 'tenant-1',
    });

    entity.setAttribute('phone', '+255700000000');
    expect(entity.attributes.phone).toBe('+255700000000');

    entity.removeAttribute('phone');
    expect(entity.attributes.phone).toBeUndefined();
  });

  it('addTag() adds without duplicating', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John',
      tenantId: 'tenant-1',
    });

    entity.addTag('vip');
    entity.addTag('vip');
    expect(entity.tags).toEqual(['vip']);
  });

  it('removeTag() removes the tag', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John',
      tenantId: 'tenant-1',
      tags: ['vip', 'regular'],
    });

    entity.removeTag('vip');
    expect(entity.tags).toEqual(['regular']);
  });

  it('deactivate(), archive(), activate() toggle state', () => {
    const entity = RegisteredEntity.register({
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John',
      tenantId: 'tenant-1',
    });

    entity.deactivate();
    expect(entity.state).toBe('INACTIVE');

    entity.archive();
    expect(entity.state).toBe('ARCHIVED');

    entity.activate();
    expect(entity.state).toBe('ACTIVE');
  });
});

describe('RegisteredEntity.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const entity = RegisteredEntity.reconstitute({
      id,
      entityType: 'Customer',
      entityCategory: 'PERSON',
      displayName: 'John Doe',
      tenantId: 'tenant-1',
      state: 'INACTIVE',
      version: 3,
      attributes: { phone: '+255700000000' },
      tags: ['vip'],
    });

    expect(entity.id.equals(id)).toBe(true);
    expect(entity.state).toBe('INACTIVE');
    expect(entity.version).toBe(3);
    expect(entity.attributes.phone).toBe('+255700000000');
    expect(entity.tags).toEqual(['vip']);
  });
});
