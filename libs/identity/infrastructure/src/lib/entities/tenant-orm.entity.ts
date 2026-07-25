import { GlobalEntity } from '@afri-market/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'tenants' })
export class TenantOrmEntity extends GlobalEntity {
  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'varchar', length: 16 })
  public status!: string;
}
