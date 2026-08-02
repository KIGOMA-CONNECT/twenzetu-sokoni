import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'service_request_messages' })
@Index(['tenantId', 'requestId'])
export class ServiceRequestMessageOrmEntity extends TenantAwareEntity {
  @Column({ name: 'request_id', type: 'uuid' })
  public requestId!: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  public senderId!: string;

  @Column({ name: 'sender_name', type: 'varchar', length: 150 })
  public senderName!: string;

  @Column({ name: 'sender_role', type: 'varchar', length: 30, default: 'customer' })
  public senderRole!: string;

  @Column({ type: 'text' })
  public message!: string;
}
