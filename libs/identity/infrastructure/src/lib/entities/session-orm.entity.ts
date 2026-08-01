import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'sessions' })
@Index(['refreshTokenHash'])
@Index(['userId'])
export class SessionOrmEntity extends GlobalEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255 })
  public refreshTokenHash!: string;

  @Column({ name: 'token_version', type: 'integer', default: 1 })
  public tokenVersion!: number;

  @Column({ name: 'device_name', type: 'varchar', length: 200, nullable: true })
  public deviceName!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  public ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  public userAgent!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  public expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  public revokedAt!: Date | null;
}
