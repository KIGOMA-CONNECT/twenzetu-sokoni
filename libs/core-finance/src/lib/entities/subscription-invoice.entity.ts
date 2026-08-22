import { decimalNumber } from './decimal-number.transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('subscription_invoices')
export class SubscriptionInvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  @Column({ name: 'amount', type: 'decimal', transformer: decimalNumber, precision: 10, scale: 2 })
  amount!: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'TZS' })
  currency!: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
