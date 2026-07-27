import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'audit_logs' })
@Index(['actorId'])
@Index(['tenantId', 'createdAt'])
export class AuditLogOrmEntity extends GlobalEntity {
  @Column({ type: 'varchar', length: 50 })
  public action!: string;

  @Column({ name: 'actor_id', type: 'uuid' })
  public actorId!: string;

  @Column({ name: 'actor_role', type: 'varchar', length: 30, nullable: true })
  public actorRole!: string | null;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  public tenantId!: string | null;

  @Column({ name: 'target_type', type: 'varchar', length: 50, nullable: true })
  public targetType!: string | null;

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  public targetId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  public metadata!: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  public ipAddress!: string | null;
}
