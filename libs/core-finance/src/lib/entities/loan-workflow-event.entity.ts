import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export const LOAN_WORKFLOW_STEPS = [
  'SUBMITTED_TO_FSP',
  'FSP_ACCEPTED',
  'SUBMITTED_TO_MARKETPLACE',
  'MARKETPLACE_APPROVED',
  'FSP_DISBURSED',
] as const;

export type LoanWorkflowStep = (typeof LOAN_WORKFLOW_STEPS)[number];

@Entity('loan_workflow_events')
export class LoanWorkflowEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'loan_id', type: 'uuid' })
  loanId!: string;

  @Column({ name: 'step', type: 'varchar', length: 40 })
  step!: LoanWorkflowStep;

  @Column({ name: 'actor_role', type: 'varchar', length: 30 })
  actorRole!: string;

  @Column({ name: 'actor_name', type: 'varchar', length: 200, nullable: true })
  actorName?: string;

  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}