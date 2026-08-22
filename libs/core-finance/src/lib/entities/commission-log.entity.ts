import { decimalNumber } from './decimal-number.transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('commission_logs')
@Index(['orderId'])
@Index(['payerType', 'payerId'])
export class CommissionLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'payer_type', type: 'varchar', length: 20 })
  payerType!: string;

  @Column({ name: 'payer_id', type: 'uuid' })
  payerId!: string;

  @Column({ name: 'order_amount', type: 'decimal', transformer: decimalNumber, precision: 12, scale: 2 })
  orderAmount!: number;

  @Column({ name: 'commission_rate', type: 'decimal', transformer: decimalNumber, precision: 5, scale: 4, default: 0.10 })
  commissionRate!: number;

  @Column({ name: 'commission_amount', type: 'decimal', transformer: decimalNumber, precision: 12, scale: 2 })
  commissionAmount!: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ name: 'deducted_at', type: 'timestamptz', nullable: true })
  deductedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
