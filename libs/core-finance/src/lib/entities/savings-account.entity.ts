import { decimalNumber } from './decimal-number.transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('savings_accounts')
export class SavingsAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'owner_type', type: 'varchar', length: 20 })
  ownerType!: string;

  @Column({ name: 'balance', type: 'decimal', transformer: decimalNumber, precision: 14, scale: 2, default: 0 })
  balance!: number;

  @Column({ name: 'frozen_balance', type: 'decimal', transformer: decimalNumber, precision: 14, scale: 2, default: 0 })
  frozenBalance!: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'TZS' })
  currency!: string;

  @Column({ name: 'interest_rate', type: 'decimal', transformer: decimalNumber, precision: 5, scale: 4, default: 0.05 })
  interestRate!: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
