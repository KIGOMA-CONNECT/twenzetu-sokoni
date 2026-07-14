import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { Position } from './position.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('Position.create', () => {
  it('defaults to active with the given code/title/description', () => {
    const position = Position.create({
      tenantId: TENANT_ID,
      code: 'SOFTWARE_ENGINEER',
      title: 'Software Engineer',
      description: 'Builds and maintains software.',
    });

    expect(position.isActive).toBe(true);
    expect(position.code).toBe('SOFTWARE_ENGINEER');
    expect(position.title).toBe('Software Engineer');
    expect(position.description).toBe('Builds and maintains software.');
  });

  it('rejects an empty code', () => {
    expect(() =>
      Position.create({ tenantId: TENANT_ID, code: '', title: 'Software Engineer' }),
    ).toThrow(BusinessRuleViolationException);
  });

  it('rejects an empty title', () => {
    expect(() =>
      Position.create({ tenantId: TENANT_ID, code: 'SOFTWARE_ENGINEER', title: '' }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('Position mutators', () => {
  it('rename() updates the title', () => {
    const position = Position.create({ tenantId: TENANT_ID, code: 'SE', title: 'Engineer' });

    position.rename('Senior Engineer');

    expect(position.title).toBe('Senior Engineer');
  });

  it('deactivate()/activate() toggle isActive', () => {
    const position = Position.create({ tenantId: TENANT_ID, code: 'SE', title: 'Engineer' });

    position.deactivate();
    expect(position.isActive).toBe(false);

    position.activate();
    expect(position.isActive).toBe(true);
  });
});

describe('Position.reconstitute', () => {
  it('rebuilds a position from persisted state', () => {
    const id = EntityId.create();

    const position = Position.reconstitute({
      id,
      tenantId: TENANT_ID,
      code: 'SE',
      title: 'Engineer',
      description: null,
      isActive: false,
    });

    expect(position.id.equals(id)).toBe(true);
    expect(position.isActive).toBe(false);
  });
});
