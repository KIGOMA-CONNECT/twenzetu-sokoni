import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('loan_repayments')
export class LoanRepaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  loanId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  principalPortion!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  interestPortion!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  remainingBalance!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  paidAt!: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reference?: string;
}
