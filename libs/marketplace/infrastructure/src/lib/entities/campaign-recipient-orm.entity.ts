import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'campaign_recipients' })
@Index(['campaignId', 'variantIndex'])
@Index(['tenantId', 'phoneNumber'])
export class CampaignRecipientOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  public campaignId!: string;

  @Column({ name: 'phone_number', type: 'varchar' })
  public phoneNumber!: string;

  @Column({ name: 'variant_index', type: 'integer', default: 0 })
  public variantIndex!: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'SENT' })
  public status!: string;

  @Column({ name: 'sent_at', type: 'timestamptz', default: () => 'NOW()' })
  public sentAt!: Date;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  public createdAt!: Date;
}
