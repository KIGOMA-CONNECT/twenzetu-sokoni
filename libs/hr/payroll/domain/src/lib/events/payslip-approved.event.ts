import { DomainEvent } from '@abms/kernel';

export class PayslipApprovedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly approvedByUserId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.payslip.approved';
  }
}
