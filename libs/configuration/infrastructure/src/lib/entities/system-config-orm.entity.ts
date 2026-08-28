import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'config_system' })
@Index(['key'], { unique: true })
@Index(['category'])
export class SystemConfigOrmEntity extends GlobalEntity {
  @Column({ type: 'varchar', length: 200 })
  public key!: string;

  @Column({ type: 'text' })
  public value!: string;

  @Column({ name: 'value_type', type: 'varchar', length: 20, default: 'STRING' })
  public valueType!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'SYSTEM' })
  public scope!: string;

  @Column({ name: 'is_encrypted', type: 'boolean', default: false })
  public isEncrypted!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  public category!: string | null;
}
