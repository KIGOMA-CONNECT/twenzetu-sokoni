import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'users' })
@Index(['phone_number'], { unique: true })
export class UserOrmEntity extends GlobalEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 15 })
  public phoneNumber!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  public fullName!: string;

  @Column({ type: 'varchar', length: 20 })
  public role!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  public passwordHash!: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  public email!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'PENDING_VERIFICATION' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
