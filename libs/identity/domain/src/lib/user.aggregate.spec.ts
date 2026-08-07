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

  it('carries real-info and AI verification fields', () => {
    const user = User.create({
      ...createProps(),
      businessName: 'Kigali Market Fresh Ltd',
      ninOrRegNo: '120199123456789',
      city: 'Kigali',
      verificationRiskScore: 15,
      verificationDocumentStatus: 'APPROVED',
    });

    expect(user.businessName).toBe('Kigali Market Fresh Ltd');
    expect(user.ninOrRegNo).toBe('120199123456789');
    expect(user.city).toBe('Kigali');
    expect(user.verificationRiskScore).toBe(15);
    expect(user.verificationDocumentStatus).toBe('APPROVED');
    expect(user.rejectionReason).toBeUndefined();
    expect(user.verifiedAt).toBeUndefined();
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

describe('User verification workflow', () => {
  it('recordAiVerification() stores risk score and document status', () => {
    const user = User.create(createProps());

    user.recordAiVerification(55, 'PENDING');

    expect(user.verificationRiskScore).toBe(55);
    expect(user.verificationDocumentStatus).toBe('PENDING');
  });

  it('recordAiVerification() rejects out-of-range risk scores', () => {
    const user = User.create(createProps());

    expect(() => user.recordAiVerification(101, 'PENDING')).toThrow(
      'verificationRiskScore must be between 0 and 100',
    );
  });

  it('approveVerification() activates the account and clears rejection', () => {
    const user = User.create(createProps());
    user.rejectVerification('Suspicious documents');

    user.approveVerification();

    expect(user.status).toBe('ACTIVE');
    expect(user.verificationDocumentStatus).toBe('APPROVED');
    expect(user.rejectionReason).toBeUndefined();
    expect(user.verifiedAt).toBeInstanceOf(Date);
  });

  it('rejectVerification() marks the account REJECTED with a reason', () => {
    const user = User.create(createProps());

    user.rejectVerification('ID number could not be verified');

    expect(user.status).toBe('REJECTED');
    expect(user.verificationDocumentStatus).toBe('REJECTED');
    expect(user.rejectionReason).toBe('ID number could not be verified');
  });

  it('rejectVerification() requires a reason', () => {
    const user = User.create(createProps());

    expect(() => user.rejectVerification('')).toThrow('rejectionReason must not be empty');
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
