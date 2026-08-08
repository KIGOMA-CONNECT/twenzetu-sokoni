import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('loans')
export class LoanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  borrowerId!: string;

  @Column({ type: 'varchar', length: 20 })
  borrowerType!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  principal!: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  interestRate!: number;

  @Column({ type: 'integer' })
  termMonths!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthlyPayment!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalRepaid!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  remainingBalance!: number;

  @Column({ type: 'text', nullable: true })
  collateral?: string;

  @Column({ type: 'text', nullable: true })
  purpose?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  disbursedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
