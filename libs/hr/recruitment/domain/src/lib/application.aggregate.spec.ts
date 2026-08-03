import { EntityId, TenantId } from '@abms/kernel';
import { Application } from './application.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function submitApplication(): Application {
  return Application.submit({
    tenantId: TENANT_ID,
    candidateId: EntityId.create(),
    jobRequisitionId: EntityId.create(),
  });
}

describe('Application', () => {
  it('submit() starts in APPLIED status and emits an event', () => {
    const application = submitApplication();

    expect(application.status).toBe('APPLIED');
    expect(application.domainEvents).toHaveLength(1);
  });

  it('walks the pipeline in order: APPLIED -> SCREENING -> INTERVIEWING -> OFFERED -> HIRED', () => {
    const application = submitApplication();

    application.advanceToScreening();
    expect(application.status).toBe('SCREENING');

    application.advanceToInterviewing();
    expect(application.status).toBe('INTERVIEWING');

    application.makeOffer();
    expect(application.status).toBe('OFFERED');

    application.hire();
    expect(application.status).toBe('HIRED');
    expect(application.domainEvents).toHaveLength(2);
  });

  it('rejects skipping a stage', () => {
    const application = submitApplication();

    expect(() => application.advanceToInterviewing()).toThrow();
  });

  it('rejects hiring before an offer is made', () => {
    const application = submitApplication();
    application.advanceToScreening();
    application.advanceToInterviewing();

    expect(() => application.hire()).toThrow();
  });

  it('reject() is valid from any non-terminal stage and records the reason', () => {
    const application = submitApplication();
    application.advanceToScreening();

    application.reject('Not enough experience');

    expect(application.status).toBe('REJECTED');
    expect(application.decisionNotes).toBe('Not enough experience');
  });

  it('reject() is not valid once already terminal', () => {
    const application = submitApplication();
    application.reject('Not a fit');

    expect(() => application.reject('Second reason')).toThrow();
  });

  it('withdraw() is valid from any non-terminal stage', () => {
    const application = submitApplication();

    application.withdraw();

    expect(application.status).toBe('WITHDRAWN');
  });

  it('withdraw() is not valid once already terminal', () => {
    const application = submitApplication();
    application.withdraw();

    expect(() => application.withdraw()).toThrow();
  });
});
