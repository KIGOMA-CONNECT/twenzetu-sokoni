import { decimalNumber } from './decimal-number.transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fixed_deposits')
export class FixedDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'principal', type: 'decimal', transformer: decimalNumber, precision: 14, scale: 2 })
  principal!: number;

  @Column({ name: 'interest_rate', type: 'decimal', transformer: decimalNumber, precision: 5, scale: 4 })
  interestRate!: number;

  @Column({ name: 'duration_months', type: 'integer' })
  durationMonths!: number;

  @Column({ name: 'maturity_date', type: 'timestamptz' })
  maturityDate!: Date;

  @Column({ name: 'maturity_amount', type: 'decimal', transformer: decimalNumber, precision: 14, scale: 2 })
  maturityAmount!: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'matured_at', type: 'timestamptz', nullable: true })
  maturedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
