import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'micro_loans' })
@Index(['borrowerId'])
export class MicroLoanOrmEntity extends TenantAwareEntity {
  @Column({ name: 'borrower_id', type: 'uuid' }) public borrowerId!: string;
  @Column({ name: 'borrower_type', type: 'varchar', length: 10 }) public borrowerType!: string;
  @Column({ name: 'loan_type', type: 'varchar', length: 20 }) public loanType!: string;
  @Column({ name: 'requested_amount', type: 'decimal', precision: 12, scale: 2 }) public requestedAmount!: number;
  @Column({ name: 'approved_amount', type: 'decimal', precision: 12, scale: 2, nullable: true }) public approvedAmount!: number | null;
  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 2 }) public interestRate!: number;
  @Column({ type: 'varchar', length: 10, default: 'TZS' }) public currency!: string;
  @Column({ name: 'outstanding_balance', type: 'decimal', precision: 12, scale: 2 }) public outstandingBalance!: number;
  @Column({ name: 'daily_repayment_amount', type: 'decimal', precision: 12, scale: 2 }) public dailyRepaymentAmount!: number;
  @Column({ name: 'total_days', type: 'int' }) public totalDays!: number;
  @Column({ name: 'repaid_days', type: 'int', default: 0 }) public repaidDays!: number;
  @Column({ type: 'varchar', length: 20, default: 'PENDING' }) public status!: string;
  @Column({ name: 'disbursed_at', type: 'timestamptz', nullable: true }) public disbursedAt!: Date | null;
  @Column({ name: 'due_at', type: 'timestamptz', nullable: true }) public dueAt!: Date | null;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
