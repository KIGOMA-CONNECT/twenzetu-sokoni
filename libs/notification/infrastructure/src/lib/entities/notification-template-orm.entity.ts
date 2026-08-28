import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'notification_templates' })
@Index(['tenantId', 'name'], { unique: true })
@Index(['tenantId', 'channel'])
export class NotificationTemplateOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'varchar', length: 20 })
  public channel!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public subject!: string | null;

  @Column({ name: 'body_template', type: 'text' })
  public bodyTemplate!: string;

  @Column({ type: 'simple-array' })
  public variables!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
