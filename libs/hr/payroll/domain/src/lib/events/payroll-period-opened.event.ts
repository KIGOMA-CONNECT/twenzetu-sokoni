import { DomainEvent } from '@abms/kernel';

export class PayrollPeriodOpenedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly year: number,
    public readonly month: number,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.payroll-period.opened';
  }
}
