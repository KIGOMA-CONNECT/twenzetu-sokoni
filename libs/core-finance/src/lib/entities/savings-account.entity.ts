import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('savings_accounts')
export class SavingsAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'varchar', length: 20 })
  ownerType!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  frozenBalance!: number;

  @Column({ type: 'varchar', length: 3, default: 'TZS' })
  currency!: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.05 })
  interestRate!: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
