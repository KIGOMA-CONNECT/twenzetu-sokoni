import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity({ name: 'push_subscriptions' })
@Unique(['userId', 'endpoint'])
@Index(['userId'])
export class PushSubscriptionOrmEntity extends GlobalEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ type: 'text', nullable: true })
  public endpoint!: string | null;

  @Column({ type: 'text', nullable: true })
  public p256dh!: string | null;

  @Column({ type: 'text', nullable: true })
  public auth!: string | null;

  @Column({ name: 'fcm_token', type: 'text', nullable: true })
  public fcmToken!: string | null;
}
