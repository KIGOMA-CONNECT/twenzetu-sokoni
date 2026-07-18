import { DomainEvent } from '@abms/kernel';

export class PayslipPaidEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly paidByUserId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.payslip.paid';
  }
}
