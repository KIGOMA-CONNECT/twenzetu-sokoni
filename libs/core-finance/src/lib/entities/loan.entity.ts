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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
