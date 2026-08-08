import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('commission_logs')
@Index(['orderId'])
@Index(['payerType', 'payerId'])
export class CommissionLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @Column({ type: 'varchar', length: 20 })
  payerType!: string;

  @Column({ type: 'uuid' })
  payerId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  orderAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.10 })
  commissionRate!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commissionAmount!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  deductedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
