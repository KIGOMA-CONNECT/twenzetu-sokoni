import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'sms_logs' })
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'createdAt'])
export class SmsLogOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'recipient_phone', type: 'varchar', length: 20 })
  public recipientPhone!: string;

  @Column({ name: 'recipient_type', type: 'varchar', length: 20 })
  public recipientType!: string;

  @Column({ type: 'text' })
  public message!: string;

  @Column({ name: 'message_length', type: 'integer' })
  public messageLength!: number;

  @Column({ name: 'credits_used', type: 'integer' })
  public creditsUsed!: number;

  @Column({ type: 'varchar', length: 20 })
  public source!: string;

  @Column({ type: 'varchar', length: 20 })
  public status!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  public provider!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  public errorMessage!: string;

  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  public referenceId!: string;
}
