import { EntityId } from '@afri-market/kernel';
import { EntityPermission } from './entity-permission.aggregate';

describe('EntityPermission.define', () => {
  it('creates a permission with default ALL scope', () => {
    const perm = EntityPermission.define({
      entityType: 'Customer',
      role: 'SALES',
      actions: ['CREATE', 'READ', 'UPDATE'],
    });

    expect(perm.entityType).toBe('Customer');
    expect(perm.role).toBe('SALES');
    expect(perm.actions).toEqual(['CREATE', 'READ', 'UPDATE']);
    expect(perm.scope).toBe('ALL');
    expect(perm.conditions).toEqual({});
    expect(perm.fields).toEqual({});
  });

  it('accepts optional scope, conditions, and fields', () => {
    const perm = EntityPermission.define({
      entityType: 'Order',
      role: 'MANAGER',
      actions: ['APPROVE', 'REJECT'],
      scope: 'DEPARTMENT',
      conditions: { amount: { $gt: 1000000 } },
      fields: {
        readable: ['amount', 'status'],
        writable: ['status'],
      },
    });

    expect(perm.scope).toBe('DEPARTMENT');
    expect(perm.conditions).toEqual({ amount: { $gt: 1000000 } });
    expect(perm.fields.readable).toEqual(['amount', 'status']);
    expect(perm.fields.writable).toEqual(['status']);
  });

  it('rejects empty entityType', () => {
    expect(() =>
      EntityPermission.define({ entityType: '', role: 'ADMIN', actions: ['READ'] })
    ).toThrow();
  });

  it('rejects empty role', () => {
    expect(() =>
      EntityPermission.define({ entityType: 'Customer', role: '', actions: ['READ'] })
    ).toThrow();
  });
});

describe('EntityPermission mutators', () => {
  it('addAction() adds without duplicating', () => {
    const perm = EntityPermission.define({
      entityType: 'Customer',
      role: 'SALES',
      actions: ['READ'],
    });

    perm.addAction('UPDATE');
    perm.addAction('UPDATE');
    expect(perm.actions).toEqual(['READ', 'UPDATE']);
  });

  it('removeAction() removes the action', () => {
    const perm = EntityPermission.define({
      entityType: 'Customer',
      role: 'SALES',
      actions: ['CREATE', 'READ', 'UPDATE'],
    });

    perm.removeAction('UPDATE');
    expect(perm.actions).toEqual(['CREATE', 'READ']);
  });

  it('updateScope(), updateConditions(), updateFields() change values', () => {
    const perm = EntityPermission.define({
      entityType: 'Customer',
      role: 'SALES',
      actions: ['READ'],
    });

    perm.updateScope('OWN');
    expect(perm.scope).toBe('OWN');

    perm.updateConditions({ active: true });
    expect(perm.conditions).toEqual({ active: true });

    perm.updateFields({ readable: ['name'] });
    expect(perm.fields.readable).toEqual(['name']);
  });
});
