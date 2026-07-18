import { AggregateRoot, BusinessRuleViolationException, EntityId, Money, TenantId } from '@abms/kernel';
import { AllowanceLine } from './salary-structure.aggregate';
import { PayrollCalculator } from './payroll-calculator';
import { StatutoryRates } from './statutory-rates';
import { PayslipApprovedEvent } from './events/payslip-approved.event';
import { PayslipGeneratedEvent } from './events/payslip-generated.event';
import { PayslipPaidEvent } from './events/payslip-paid.event';

export type PayslipStatus = 'DRAFT' | 'APPROVED' | 'PAID';

interface GeneratePayslipProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly payrollPeriodId: EntityId;
  readonly basicSalary: Money;
  readonly allowances: readonly AllowanceLine[];
  readonly statutoryRates: StatutoryRates;
}

interface ReconstitutePayslipProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly payrollPeriodId: EntityId;
  readonly basicSalary: Money;
  readonly allowances: readonly AllowanceLine[];
  readonly grossPay: Money;
  readonly payeAmount: Money;
  readonly nssfEmployeeAmount: Money;
  readonly nssfEmployerAmount: Money;
  readonly wcfEmployerAmount: Money;
  readonly sdlEmployerAmount: Money;
  readonly netPay: Money;
  readonly status: PayslipStatus;
  readonly approvedByUserId: string | null;
  readonly approvedAt: Date | null;
  readonly paidByUserId: string | null;
  readonly paidAt: Date | null;
}

// v1 gross-to-net: grossPay = basicSalary + allowances; netPay = grossPay -
// (PAYE + employee NSSF). NSSF-employer/WCF/SDL are employer-borne costs,
// never deducted from the employee — carried on the Payslip as informational
// fields for the eventual GL-posting/Finance integration (not built yet).
// See ADR-0010 for what's deliberately out of scope (loans, advances,
// benefits-in-kind, bonuses, overtime).
export class Payslip extends AggregateRoot<EntityId> {
  private _status: PayslipStatus;
  private _approvedByUserId: string | null;
  private _approvedAt: Date | null;
  private _paidByUserId: string | null;
  private _paidAt: Date | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _payrollPeriodId: EntityId,
    private readonly _basicSalary: Money,
    private readonly _allowances: readonly AllowanceLine[],
    private readonly _grossPay: Money,
    private readonly _payeAmount: Money,
    private readonly _nssfEmployeeAmount: Money,
    private readonly _nssfEmployerAmount: Money,
    private readonly _wcfEmployerAmount: Money,
    private readonly _sdlEmployerAmount: Money,
    private readonly _netPay: Money,
    status: PayslipStatus,
    approvedByUserId: string | null,
    approvedAt: Date | null,
    paidByUserId: string | null,
    paidAt: Date | null,
  ) {
    super(id);
    this._status = status;
    this._approvedByUserId = approvedByUserId;
    this._approvedAt = approvedAt;
    this._paidByUserId = paidByUserId;
    this._paidAt = paidAt;
  }

  public static generate(props: GeneratePayslipProps): Payslip {
    const grossPay = props.allowances.reduce(
      (total, allowance) => total.add(allowance.amount).getValue(),
      props.basicSalary,
    );
    const payeAmount = PayrollCalculator.calculatePaye(grossPay, props.statutoryRates.payeBands);
    const nssfEmployeeAmount = grossPay.percentageOf(props.statutoryRates.nssfEmployeeRateBasisPoints);
    const nssfEmployerAmount = grossPay.percentageOf(props.statutoryRates.nssfEmployerRateBasisPoints);
    const wcfEmployerAmount = grossPay.percentageOf(props.statutoryRates.wcfEmployerRateBasisPoints);
    const sdlEmployerAmount = grossPay.percentageOf(props.statutoryRates.sdlEmployerRateBasisPoints);
    const totalEmployeeDeductions = payeAmount.add(nssfEmployeeAmount).getValue();
    const netPay = grossPay.subtract(totalEmployeeDeductions).getValue();

    const payslip = new Payslip(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.payrollPeriodId,
      props.basicSalary,
      props.allowances,
      grossPay,
      payeAmount,
      nssfEmployeeAmount,
      nssfEmployerAmount,
      wcfEmployerAmount,
      sdlEmployerAmount,
      netPay,
      'DRAFT',
      null,
      null,
      null,
      null,
    );
    payslip.addDomainEvent(
      new PayslipGeneratedEvent(
        payslip.id.toValue(),
        props.tenantId.value,
        props.employeeId.toValue(),
        props.payrollPeriodId.toValue(),
      ),
    );
    return payslip;
  }

  public static reconstitute(props: ReconstitutePayslipProps): Payslip {
    return new Payslip(
      props.id,
      props.tenantId,
      props.employeeId,
      props.payrollPeriodId,
      props.basicSalary,
      props.allowances,
      props.grossPay,
      props.payeAmount,
      props.nssfEmployeeAmount,
      props.nssfEmployerAmount,
      props.wcfEmployerAmount,
      props.sdlEmployerAmount,
      props.netPay,
      props.status,
      props.approvedByUserId,
      props.approvedAt,
      props.paidByUserId,
      props.paidAt,
    );
  }

  public approve(approvedByUserId: string): void {
    if (this._status !== 'DRAFT') {
      throw new BusinessRuleViolationException(`Cannot approve: payslip is already ${this._status}.`);
    }
    this._status = 'APPROVED';
    this._approvedByUserId = approvedByUserId;
    this._approvedAt = new Date();
    this.addDomainEvent(
      new PayslipApprovedEvent(this.id.toValue(), this._tenantId.value, approvedByUserId),
    );
  }

  public markPaid(paidByUserId: string): void {
    if (this._status !== 'APPROVED') {
      throw new BusinessRuleViolationException(
        `Cannot mark as paid: payslip must be APPROVED first (currently ${this._status}).`,
      );
    }
    this._status = 'PAID';
    this._paidByUserId = paidByUserId;
    this._paidAt = new Date();
    this.addDomainEvent(new PayslipPaidEvent(this.id.toValue(), this._tenantId.value, paidByUserId));
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get payrollPeriodId(): EntityId {
    return this._payrollPeriodId;
  }

  public get basicSalary(): Money {
    return this._basicSalary;
  }

  public get allowances(): readonly AllowanceLine[] {
    return this._allowances;
  }

  public get grossPay(): Money {
    return this._grossPay;
  }

  public get payeAmount(): Money {
    return this._payeAmount;
  }

  public get nssfEmployeeAmount(): Money {
    return this._nssfEmployeeAmount;
  }

  public get nssfEmployerAmount(): Money {
    return this._nssfEmployerAmount;
  }

  public get wcfEmployerAmount(): Money {
    return this._wcfEmployerAmount;
  }

  public get sdlEmployerAmount(): Money {
    return this._sdlEmployerAmount;
  }

  public get netPay(): Money {
    return this._netPay;
  }

  public get status(): PayslipStatus {
    return this._status;
  }

  public get approvedByUserId(): string | null {
    return this._approvedByUserId;
  }

  public get approvedAt(): Date | null {
    return this._approvedAt;
  }

  public get paidByUserId(): string | null {
    return this._paidByUserId;
  }

  public get paidAt(): Date | null {
    return this._paidAt;
  }
}
