import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'notifications' })
@Index(['userId', 'isRead'])
export class NotificationOrmEntity extends GlobalEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ type: 'varchar', length: 200 })
  public title!: string;

  @Column({ type: 'text' })
  public message!: string;

  @Column({ type: 'varchar', length: 50 })
  public type!: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  public referenceId!: string | null;

  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  public referenceType!: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  public isRead!: boolean;
}
