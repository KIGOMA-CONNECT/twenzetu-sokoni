import { DomainEvent } from '@abms/kernel';

export class PayslipGeneratedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly payrollPeriodId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.payslip.generated';
  }
}
