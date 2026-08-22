import { decimalNumber } from './decimal-number.transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('loan_repayments')
export class LoanRepaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'loan_id', type: 'uuid' })
  loanId!: string;

  @Column({ name: 'amount', type: 'decimal', transformer: decimalNumber, precision: 12, scale: 2 })
  amount!: number;

  @Column({ name: 'principal_portion', type: 'decimal', transformer: decimalNumber, precision: 12, scale: 2 })
  principalPortion!: number;

  @Column({ name: 'interest_portion', type: 'decimal', transformer: decimalNumber, precision: 12, scale: 2 })
  interestPortion!: number;

  @Column({ name: 'remaining_balance', type: 'decimal', transformer: decimalNumber, precision: 14, scale: 2 })
  remainingBalance!: number;

  @CreateDateColumn({ name: 'paid_at', type: 'timestamptz' })
  paidAt!: Date;

  @Column({ name: 'reference', type: 'varchar', length: 200, nullable: true })
  reference?: string;
}
