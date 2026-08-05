import { Email, EntityId, PhoneNumber, TenantId } from '@afri-market/kernel';
import { User } from './user.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
const EMAIL = Email.create('ceo@afribiz.co.tz');
const PHONE = PhoneNumber.create('+255712345678');

function createProps() {
  return {
    tenantId: TENANT_ID,
    phoneNumber: PHONE,
    fullName: 'Afribiz CEO',
    role: 'admin' as const,
    passwordHash: 'hashed-value',
    email: EMAIL,
  };
}

describe('User.create', () => {
  it('defaults to PENDING_VERIFICATION with version 1', () => {
    const user = User.create(createProps());

    expect(user.email?.value).toBe('ceo@afribiz.co.tz');
    expect(user.phoneNumber.value).toBe('+255712345678');
    expect(user.fullName).toBe('Afribiz CEO');
    expect(user.role).toBe('admin');
    expect(user.status).toBe('PENDING_VERIFICATION');
    expect(user.version).toBe(1);
  });

  it('grants admin roles their default permissions', () => {
    const user = User.create(createProps());

    expect(user.permissions).toContain('manage_orders');
  });

  it('rejects an empty passwordHash', () => {
    expect(() => User.create({ ...createProps(), passwordHash: '' })).toThrow(
      'passwordHash must not be empty',
    );
  });

  it('rejects an empty fullName', () => {
    expect(() => User.create({ ...createProps(), fullName: ' ' })).toThrow(
      'fullName must not be empty',
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

    expect(() => user.changePasswordHash('')).toThrow('passwordHash must not be empty');
  });

  it('changeRole() replaces the role', () => {
    const user = User.create(createProps());

    user.changeRole('support_admin');

    expect(user.role).toBe('support_admin');
  });

  it('activate()/suspend() toggle status', () => {
    const user = User.create(createProps());

    user.suspend();
    expect(user.status).toBe('SUSPENDED');

    user.activate();
    expect(user.status).toBe('ACTIVE');
  });

  it('updateFullName() replaces the full name', () => {
    const user = User.create(createProps());

    user.updateFullName('New Name');

    expect(user.fullName).toBe('New Name');
  });
});

describe('User.reconstitute', () => {
  it('rebuilds a user from persisted state', () => {
    const id = EntityId.create();

    const user = User.reconstitute({
      id,
      ...createProps(),
      status: 'ACTIVE',
      version: 4,
    });

    expect(user.id.equals(id)).toBe(true);
    expect(user.status).toBe('ACTIVE');
    expect(user.version).toBe(4);
  });
});
