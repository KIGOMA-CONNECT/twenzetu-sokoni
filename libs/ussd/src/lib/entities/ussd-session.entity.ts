import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('ussd_sessions')
export class UssdSessionEntity {
  @PrimaryColumn({ name: 'session_id' })
  sessionId!: string;

  @Column({ name: 'phone_number' })
  phoneNumber!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'user_role', nullable: true })
  userRole?: string;

  @Column({ name: 'current_menu', default: 'main' })
  currentMenu!: string;

  @Column({ type: 'jsonb', default: '{}' })
  data!: Record<string, any>;

  @Column({ type: 'jsonb', default: '[]' })
  cart!: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'last_accessed_at', type: 'timestamp' })
  lastAccessedAt!: Date;
}
