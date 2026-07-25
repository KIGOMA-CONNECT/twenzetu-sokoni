import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'hyperlocal_pois' })
@Index(['type'])
export class HyperlocalPoiOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 }) public name!: string;
  @Column({ name: 'local_name', type: 'varchar', length: 200, nullable: true }) public localName!: string | null;
  @Column({ type: 'text', nullable: true }) public description!: string | null;
  @Column({ type: 'varchar', length: 20 }) public type!: string;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) public latitude!: number;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) public longitude!: number;
  @Column({ name: 'street_address', type: 'text', nullable: true }) public streetAddress!: string | null;
  @Column({ name: 'landmark_description', type: 'text', nullable: true }) public landmarkDescription!: string | null;
  @Column({ name: 'submitted_by', type: 'uuid' }) public submittedBy!: string;
  @Column({ type: 'varchar', length: 20 }) public source!: string;
  @Column({ name: 'verified_by', type: 'uuid', nullable: true }) public verifiedBy!: string | null;
  @Column({ name: 'verification_count', type: 'int', default: 0 }) public verificationCount!: number;
  @Column({ name: 'is_active', type: 'boolean', default: true }) public isActive!: boolean;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
