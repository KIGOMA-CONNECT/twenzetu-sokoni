import { DomainEvent } from '@abms/kernel';

export class PayrollPeriodClosedEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.payroll-period.closed';
  }
}
