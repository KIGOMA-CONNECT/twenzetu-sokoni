import { decimalNumber } from './decimal-number.transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface RequiredAttachment {
  type: string;
  label: string;
  required: boolean;
}

@Entity('loan_products')
export class LoanProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'code', type: 'varchar', length: 30 })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'borrower_type', type: 'varchar', length: 20 })
  borrowerType!: string;

  @Column({ name: 'loan_type', type: 'varchar', length: 30 })
  loanType!: string;

  @Column({ name: 'min_amount', type: 'decimal', transformer: decimalNumber, precision: 14, scale: 2 })
  minAmount!: number;

  @Column({ name: 'max_amount', type: 'decimal', transformer: decimalNumber, precision: 14, scale: 2 })
  maxAmount!: number;

  @Column({ name: 'min_term_months', type: 'integer', default: 1 })
  minTermMonths!: number;

  @Column({ name: 'max_term_months', type: 'integer' })
  maxTermMonths!: number;

  @Column({ name: 'annual_interest_rate', type: 'decimal', transformer: decimalNumber, precision: 5, scale: 4 })
  annualInterestRate!: number;

  @Column({ name: 'processing_fee_rate', type: 'decimal', transformer: decimalNumber, precision: 5, scale: 4, default: 0 })
  processingFeeRate!: number;

  @Column({ name: 'insurance_rate', type: 'decimal', transformer: decimalNumber, precision: 5, scale: 4, default: 0 })
  insuranceRate!: number;

  @Column({ name: 'liquidation_amount', type: 'decimal', transformer: decimalNumber, precision: 12, scale: 2, default: 0 })
  liquidationAmount!: number;

  @Column({ name: 'required_attachments', type: 'jsonb', default: [] })
  requiredAttachments!: RequiredAttachment[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}