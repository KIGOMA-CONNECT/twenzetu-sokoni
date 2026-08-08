import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fixed_deposits')
export class FixedDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  accountId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  principal!: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  interestRate!: number;

  @Column({ type: 'integer' })
  durationMonths!: number;

  @Column({ type: 'timestamptz' })
  maturityDate!: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  maturityAmount!: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  maturedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
