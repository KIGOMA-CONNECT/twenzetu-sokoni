import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('savings_transactions')
export class SavingsTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  accountId!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reference?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
