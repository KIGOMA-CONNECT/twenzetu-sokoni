import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'config_tenant' })
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'category'])
export class TenantConfigOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  public key!: string;

  @Column({ type: 'text' })
  public value!: string;

  @Column({ name: 'value_type', type: 'varchar', length: 20, default: 'STRING' })
  public valueType!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  public category!: string | null;
}
