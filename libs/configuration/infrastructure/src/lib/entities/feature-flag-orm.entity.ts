import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'config_feature_flags' })
@Index(['key'], { unique: true })
export class FeatureFlagOrmEntity extends GlobalEntity {
  @Column({ type: 'varchar', length: 100 })
  public key!: string;

  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'DISABLED' })
  public state!: string;

  @Column({ type: 'integer', default: 100 })
  public percentage!: number;

  @Column({ name: 'allowed_tenant_ids', type: 'simple-array', nullable: true })
  public allowedTenantIds!: string[];

  @Column({ name: 'allowed_roles', type: 'simple-array', nullable: true })
  public allowedRoles!: string[];
}
