import { GlobalEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

/**
 * WORM (Write-Once-Read-Many) — see ADR-0006. Deliberately outside RLS
 * (tenant_id/user_id are plain nullable columns, matching Tenant/User's own
 * ADR-0005 precedent): some audited actions (tenant registration, a failed
 * login against an unknown email) happen before any tenant context exists.
 * True immutability comes from the migration explicitly revoking UPDATE/DELETE
 * from the runtime role, not from RLS.
 */
@Entity({ name: 'audit_log' })
@Index(['tenantId'])
@Index(['correlationId'])
export class AuditLogOrmEntity extends GlobalEntity {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  public tenantId!: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  public userId!: string | null;

  @Column({ name: 'command_name', type: 'varchar', length: 200 })
  public commandName!: string;

  @Column({ name: 'correlation_id', type: 'uuid' })
  public correlationId!: string;

  @Column({ type: 'varchar', length: 16 })
  public outcome!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  public errorMessage!: string | null;
}
