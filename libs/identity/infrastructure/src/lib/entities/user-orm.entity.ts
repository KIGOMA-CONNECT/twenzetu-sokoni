import { GlobalEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'user' })
@Index(['email'], { unique: true })
export class UserOrmEntity extends GlobalEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @Column({ type: 'varchar', length: 254 })
  public email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  public passwordHash!: string;

  @Column({ type: 'varchar', length: 32 })
  public role!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
