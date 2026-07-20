import { DomainEvent } from '@abms/kernel';

export type ComplianceCategory = 'SAFETY' | 'LEGAL' | 'CERTIFICATION' | 'TRAINING' | 'OTHER';
export type ComplianceRecurrence = 'ONE_TIME' | 'QUARTERLY' | 'ANNUAL' | 'BIENNIAL';

export class ComplianceRequirementCreatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly category: ComplianceCategory,
    public readonly recurrence: ComplianceRecurrence,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.compliance-requirement.created';
  }
}
