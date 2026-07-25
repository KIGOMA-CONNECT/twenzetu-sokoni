import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'otps' })
@Index(['phone_number', 'code'])
export class OtpOrmEntity extends GlobalEntity {
  @Column({ name: 'phone_number', type: 'varchar', length: 15 })
  public phoneNumber!: string;

  @Column({ type: 'varchar', length: 10 })
  public code!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  public expiresAt!: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  public isUsed!: boolean;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  public tenantId!: string | null;
}
