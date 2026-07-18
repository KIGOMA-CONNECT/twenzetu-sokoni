import { Email, TenantId } from '@abms/kernel';
import { Candidate } from './candidate.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('Candidate', () => {
  it('registers with the given contact details and emits an event', () => {
    const candidate = Candidate.register({
      tenantId: TENANT_ID,
      firstName: 'Amina',
      lastName: 'Juma',
      email: Email.create('amina.juma@example.com').getValue(),
      phone: null,
      resumeUrl: null,
      source: 'LinkedIn',
    });

    expect(candidate.firstName).toBe('Amina');
    expect(candidate.source).toBe('LinkedIn');
    expect(candidate.domainEvents).toHaveLength(1);
  });

  it('rejects an empty firstName', () => {
    expect(() =>
      Candidate.register({
        tenantId: TENANT_ID,
        firstName: '  ',
        lastName: 'Juma',
        email: Email.create('amina.juma@example.com').getValue(),
        phone: null,
        resumeUrl: null,
        source: null,
      }),
    ).toThrow();
  });
});
