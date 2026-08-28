import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'notifications' })
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'channel'])
export class NotificationOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ type: 'varchar', length: 20 })
  public channel!: string;

  @Column({ type: 'varchar', length: 255 })
  public title!: string;

  @Column({ type: 'text' })
  public body!: string;

  @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
  public priority!: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  public status!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  public data!: Record<string, unknown>;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  public templateId!: string | null;

  @Column({ name: 'template_variables', type: 'jsonb', default: () => "'{}'" })
  public templateVariables!: Record<string, string>;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  public sentAt!: Date | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  public readAt!: Date | null;
}
