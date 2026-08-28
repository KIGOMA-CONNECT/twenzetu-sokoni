import { EntityId, IRepository } from '@afri-market/kernel';
import { EntityRelationship, RelationshipType } from './entity-relationship.aggregate';

export interface IEntityRelationshipRepository extends IRepository<EntityRelationship, EntityId> {
  findBySourceEntityType(sourceEntityType: string): Promise<EntityRelationship[]>;
  findByTargetEntityType(targetEntityType: string): Promise<EntityRelationship[]>;
  findByRelationshipType(relationshipType: RelationshipType): Promise<EntityRelationship[]>;
  findByEntityType(entityType: string): Promise<EntityRelationship[]>;
  findActive(): Promise<EntityRelationship[]>;
}
