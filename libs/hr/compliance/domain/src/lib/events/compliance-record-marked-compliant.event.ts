import { DomainEvent } from '@abms/kernel';

export class ComplianceRecordMarkedCompliantEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly complianceRequirementId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.compliance-record.marked-compliant';
  }
}
