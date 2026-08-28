import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'ubr_entity_relationships' })
@Index(['sourceEntityType', 'targetEntityType'])
@Index(['relationshipType'])
export class EntityRelationshipOrmEntity extends GlobalEntity {
  @Column({ name: 'source_entity_type', type: 'varchar', length: 100 })
  public sourceEntityType!: string;

  @Column({ name: 'target_entity_type', type: 'varchar', length: 100 })
  public targetEntityType!: string;

  @Column({ name: 'relationship_type', type: 'varchar', length: 50 })
  public relationshipType!: string;

  @Column({ type: 'varchar', length: 255 })
  public label!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'ONE_TO_MANY' })
  public cardinality!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public state!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  public properties!: Record<string, unknown>;
}
