import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('savings_transactions')
export class SavingsTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type!: string;

  @Column({ name: 'amount', type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 14, scale: 2 })
  balanceAfter!: number;

  @Column({ name: 'reference', type: 'varchar', length: 200, nullable: true })
  reference?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
