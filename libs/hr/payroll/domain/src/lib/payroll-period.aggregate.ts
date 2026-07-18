import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { PayrollPeriodClosedEvent } from './events/payroll-period-closed.event';
import { PayrollPeriodOpenedEvent } from './events/payroll-period-opened.event';

export type PayrollPeriodStatus = 'OPEN' | 'CLOSED';

interface OpenPayrollPeriodProps {
  readonly tenantId: TenantId;
  readonly year: number;
  readonly month: number;
}

interface ReconstitutePayrollPeriodProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly year: number;
  readonly month: number;
  readonly status: PayrollPeriodStatus;
}

// Payslips may only be generated/approved/paid while the owning period is
// OPEN — closing is a one-way terminal transition (matches Employee's
// terminate() and LeaveType's deactivate()-is-reversible-but-terminate-isn't
// precedent family): once a period is closed, its payslips are final and a
// correction becomes a new period's adjustment, not a reopened old one.
export class PayrollPeriod extends AggregateRoot<EntityId> {
  private _status: PayrollPeriodStatus;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _year: number,
    private readonly _month: number,
    status: PayrollPeriodStatus,
  ) {
    super(id);
    this._status = status;
  }

  public static open(props: OpenPayrollPeriodProps): PayrollPeriod {
    Guard.assert(Guard.inRange(props.year, 2000, 2200, 'year'));
    Guard.assert(Guard.inRange(props.month, 1, 12, 'month'));

    const period = new PayrollPeriod(EntityId.create(), props.tenantId, props.year, props.month, 'OPEN');
    period.addDomainEvent(
      new PayrollPeriodOpenedEvent(period.id.toValue(), props.tenantId.value, props.year, props.month),
    );
    return period;
  }

  public static reconstitute(props: ReconstitutePayrollPeriodProps): PayrollPeriod {
    return new PayrollPeriod(props.id, props.tenantId, props.year, props.month, props.status);
  }

  public close(): void {
    if (this._status === 'CLOSED') {
      throw new BusinessRuleViolationException('Payroll period is already closed.');
    }
    this._status = 'CLOSED';
    this.addDomainEvent(new PayrollPeriodClosedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertOpen(): void {
    if (this._status !== 'OPEN') {
      throw new BusinessRuleViolationException(
        `Payroll period ${this._year}-${this._month} is closed; no further payslip changes are allowed.`,
      );
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get year(): number {
    return this._year;
  }

  public get month(): number {
    return this._month;
  }

  public get status(): PayrollPeriodStatus {
    return this._status;
  }
}
