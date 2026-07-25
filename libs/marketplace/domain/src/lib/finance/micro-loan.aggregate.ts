import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { MicroLoanStatus, LoanType } from './micro-loan-status';

export interface MicroLoanProps {
  tenantId: TenantId;
  borrowerId: EntityId;
  borrowerType: 'vendor' | 'driver';
  loanType: LoanType;
  requestedAmount: Money;
  approvedAmount?: Money;
  interestRate: number;
  outstandingBalance: Money;
  dailyRepaymentAmount: Money;
  totalDays: number;
  repaidDays: number;
  status: MicroLoanStatus;
  disbursedAt?: Date;
  dueAt?: Date;
  version: number;
}

export class MicroLoan extends AggregateRoot<EntityId> {
  private constructor(id: EntityId, private readonly props: MicroLoanProps) {
    super(id);
  }

  public get tenantId(): TenantId {
    return this.props.tenantId;
  }

  public get borrowerId(): EntityId {
    return this.props.borrowerId;
  }

  public get borrowerType(): string {
    return this.props.borrowerType;
  }

  public get loanType(): LoanType {
    return this.props.loanType;
  }

  public get requestedAmount(): Money {
    return this.props.requestedAmount;
  }

  public get approvedAmount(): Money | undefined {
    return this.props.approvedAmount;
  }

  public get interestRate(): number {
    return this.props.interestRate;
  }

  public get outstandingBalance(): Money {
    return this.props.outstandingBalance;
  }

  public get dailyRepaymentAmount(): Money {
    return this.props.dailyRepaymentAmount;
  }

  public get totalDays(): number {
    return this.props.totalDays;
  }

  public get repaidDays(): number {
    return this.props.repaidDays;
  }

  public get status(): MicroLoanStatus {
    return this.props.status;
  }

  public get version(): number {
    return this.props.version;
  }

  public approve(amount: Money): void {
    Guard.assert(this.props.status === 'PENDING', 'Can only approve pending loans');
    this.props.approvedAmount = amount;
    this.props.outstandingBalance = amount;
    this.props.status = 'APPROVED';
    this.props.version++;
  }

  public disburse(): void {
    Guard.assert(this.props.status === 'APPROVED', 'Can only disburse approved loans');
    this.props.status = 'DISBURSED';
    this.props.disbursedAt = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + this.props.totalDays);
    this.props.dueAt = dueDate;
    this.props.version++;
  }

  public repay(amount: Money): void {
    Guard.assert(this.props.status === 'DISBURSED', 'Can only repay disbursed loans');
    this.props.outstandingBalance = this.props.outstandingBalance.subtract(amount);
    this.props.repaidDays++;
    this.props.version++;
    if (this.props.outstandingBalance.amount <= 0) {
      this.props.status = 'REPAID';
    }
  }

  public default(): void {
    Guard.assert(this.props.status === 'DISBURSED', 'Can only default disbursed loans');
    this.props.status = 'DEFAULTED';
    this.props.version++;
  }

  public getRemainingBalance(): Money {
    return this.props.outstandingBalance;
  }

  public static create(props: {
    id?: EntityId;
    tenantId: TenantId;
    borrowerId: EntityId;
    borrowerType: 'vendor' | 'driver';
    loanType: LoanType;
    requestedAmount: Money;
    interestRate: number;
    dailyRepaymentAmount: Money;
    totalDays: number;
  }): MicroLoan {
    const id = props.id ?? EntityId.create();
    return new MicroLoan(id, {
      ...props,
      outstandingBalance: props.requestedAmount,
      repaidDays: 0,
      status: 'PENDING',
      version: 1,
    });
  }

  public static reconstitute(id: EntityId, props: MicroLoanProps): MicroLoan {
    return new MicroLoan(id, { ...props });
  }
}
