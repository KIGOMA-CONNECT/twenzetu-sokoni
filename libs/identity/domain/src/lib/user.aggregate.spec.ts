import { BusinessRuleViolationException, Email, EntityId, TenantId } from '@abms/kernel';
import { User } from './user.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const EMAIL = Email.create('ceo@afribiz.co.tz').getValue();

function createProps() {
  return { tenantId: TENANT_ID, email: EMAIL, passwordHash: 'hashed-value', role: 'CEO' as const };
}

describe('User.create', () => {
  it('defaults to active with version 1', () => {
    const user = User.create(createProps());

    expect(user.email.value).toBe('ceo@afribiz.co.tz');
    expect(user.role).toBe('CEO');
    expect(user.isActive).toBe(true);
    expect(user.version).toBe(1);
  });

  it('rejects an empty passwordHash', () => {
    expect(() => User.create({ ...createProps(), passwordHash: '' })).toThrow(
      BusinessRuleViolationException,
    );
  });
});

describe('User mutators', () => {
  it('changePasswordHash() replaces the hash', () => {
    const user = User.create(createProps());

    user.changePasswordHash('new-hashed-value');

    expect(user.passwordHash).toBe('new-hashed-value');
  });

  it('changePasswordHash() rejects an empty hash', () => {
    const user = User.create(createProps());

    expect(() => user.changePasswordHash('')).toThrow(BusinessRuleViolationException);
  });

  it('changeRole() replaces the role', () => {
    const user = User.create(createProps());

    user.changeRole('FINANCIAL_OFFICER');

    expect(user.role).toBe('FINANCIAL_OFFICER');
  });

  it('deactivate()/reactivate() toggle isActive', () => {
    const user = User.create(createProps());

    user.deactivate();
    expect(user.isActive).toBe(false);

    user.reactivate();
    expect(user.isActive).toBe(true);
  });
});

describe('User.reconstitute', () => {
  it('rebuilds a user from persisted state', () => {
    const id = EntityId.create();

    const user = User.reconstitute({
      id,
      ...createProps(),
      isActive: false,
      version: 4,
    });

    expect(user.id.equals(id)).toBe(true);
    expect(user.isActive).toBe(false);
    expect(user.version).toBe(4);
  });
});
