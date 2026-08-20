import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('loans')
export class LoanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'borrower_id', type: 'uuid' })
  borrowerId!: string;

  @Column({ name: 'borrower_type', type: 'varchar', length: 20 })
  borrowerType!: string;

  @Column({ name: 'principal', type: 'decimal', precision: 14, scale: 2 })
  principal!: number;

  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 4 })
  interestRate!: number;

  @Column({ name: 'term_months', type: 'integer' })
  termMonths!: number;

  @Column({ name: 'monthly_payment', type: 'decimal', precision: 12, scale: 2 })
  monthlyPayment!: number;

  @Column({ name: 'total_repaid', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalRepaid!: number;

  @Column({ name: 'remaining_balance', type: 'decimal', precision: 14, scale: 2 })
  remainingBalance!: number;

  @Column({ name: 'collateral', type: 'text', nullable: true })
  collateral?: string;

  @Column({ name: 'purpose', type: 'text', nullable: true })
  purpose?: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'disbursed_at', type: 'timestamptz', nullable: true })
  disbursedAt?: Date;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ name: 'application_number', type: 'varchar', length: 40, nullable: true })
  applicationNumber?: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string;

  @Column({ name: 'mobile_number', type: 'varchar', length: 20, nullable: true })
  mobileNumber?: string;

  @Column({ name: 'net_amount', type: 'decimal', precision: 14, scale: 2, nullable: true })
  netAmount?: number;

  @Column({ name: 'interest_amount', type: 'decimal', precision: 14, scale: 2, nullable: true })
  interestAmount?: number;

  @Column({ name: 'insurance_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  insuranceAmount!: number;

  @Column({ name: 'processing_fee_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  processingFeeAmount!: number;

  @Column({ name: 'liquidation_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  liquidationAmount!: number;

  @Column({ name: 'total_amount_to_pay', type: 'decimal', precision: 14, scale: 2, nullable: true })
  totalAmountToPay?: number;

  @Column({ name: 'deductible_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  deductibleAmount?: number;

  @Column({ name: 'fsp_name', type: 'varchar', length: 120, nullable: true })
  fspName?: string;

  @Column({ name: 'fsp_code', type: 'varchar', length: 40, nullable: true })
  fspCode?: string;

  @Column({ name: 'branch_name', type: 'varchar', length: 120, nullable: true })
  branchName?: string;

  @Column({ name: 'account_number', type: 'varchar', length: 60, nullable: true })
  accountNumber?: string;

  @Column({ name: 'deduction_code', type: 'varchar', length: 40, nullable: true })
  deductionCode?: string;

  @Column({ name: 'workflow_state', type: 'varchar', length: 40, default: 'SUBMITTED_TO_FSP' })
  workflowState!: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
