import { Injectable, Inject } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import {
  RegisteredEntity,
  EntityCategory,
  EntityRelationship,
  RelationshipType,
} from '@abms/ubr';

export interface RegisterEntityDto {
  entityType: string;
  entityCategory: EntityCategory;
  displayName: string;
  tenantId: string;
  attributes?: Record<string, unknown>;
  tags?: string[];
  parentEntityId?: string;
}

export interface UpdateEntityDto {
  displayName?: string;
  attributes?: Record<string, unknown>;
  tags?: string[];
  state?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface DefineRelationshipDto {
  sourceEntityType: string;
  targetEntityType: string;
  relationshipType: RelationshipType;
  label: string;
  description?: string;
  cardinality?: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  properties?: Record<string, unknown>;
}

@Injectable()
export class OntologyService {
  constructor(
    @Inject('IRegisteredEntityRepository')
    private readonly entityRepo: any,
    @Inject('IEntityRelationshipRepository')
    private readonly relationshipRepo: any,
  ) {}

  async registerEntity(dto: RegisterEntityDto): Promise<RegisteredEntity> {
    const entity = RegisteredEntity.register({
      entityType: dto.entityType,
      entityCategory: dto.entityCategory,
      displayName: dto.displayName,
      tenantId: dto.tenantId,
      attributes: dto.attributes,
      tags: dto.tags,
      parentEntityId: dto.parentEntityId,
    });

    await this.entityRepo.create({
      id: entity.id.value,
      entityType: entity.entityType,
      entityCategory: entity.entityCategory,
      displayName: entity.displayName,
      tenantId: entity.tenantId,
      state: entity.state,
      attributes: entity.attributes,
      tags: entity.tags.join(','),
      parentEntityId: entity.parentEntityId ?? null,
      version: entity.version,
    });

    return entity;
  }

  async getEntity(id: string, tenantId: string): Promise<RegisteredEntity | null> {
    const entity = await this.entityRepo.findById(id, tenantId);
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async getEntitiesByType(entityType: string, tenantId: string): Promise<RegisteredEntity[]> {
    const entities = await this.entityRepo.findByType(entityType, tenantId);
    return entities.map((e: any) => this.toDomain(e));
  }

  async getEntitiesByCategory(category: EntityCategory, tenantId: string): Promise<RegisteredEntity[]> {
    const entities = await this.entityRepo.findByCategory(category, tenantId);
    return entities.map((e: any) => this.toDomain(e));
  }

  async getAllEntities(tenantId: string): Promise<RegisteredEntity[]> {
    const entities = await this.entityRepo.findByTenant(tenantId);
    return entities.map((e: any) => this.toDomain(e));
  }

  async searchEntities(query: string, tenantId: string): Promise<RegisteredEntity[]> {
    const entities = await this.entityRepo.search(query, tenantId);
    return entities.map((e: any) => this.toDomain(e));
  }

  async updateEntity(id: string, tenantId: string, dto: UpdateEntityDto): Promise<RegisteredEntity | null> {
    const entity = await this.entityRepo.findById(id, tenantId);
    if (!entity) return null;

    if (dto.displayName) entity.display_name = dto.displayName;
    if (dto.attributes) entity.attributes = dto.attributes;
    if (dto.tags) entity.tags = dto.tags.join(',');
    if (dto.state) entity.state = dto.state;

    await this.entityRepo.save(entity);
    return this.toDomain(entity);
  }

  async deactivateEntity(id: string, tenantId: string): Promise<boolean> {
    const entity = await this.entityRepo.findById(id, tenantId);
    if (!entity) return false;
    entity.state = 'INACTIVE';
    await this.entityRepo.save(entity);
    return true;
  }

  async deleteEntity(id: string, tenantId: string): Promise<boolean> {
    const entity = await this.entityRepo.findById(id, tenantId);
    if (!entity) return false;
    await this.entityRepo.delete(id, tenantId);
    return true;
  }

  // Relationship methods

  async defineRelationship(dto: DefineRelationshipDto): Promise<EntityRelationship> {
    const relationship = EntityRelationship.define({
      sourceEntityType: dto.sourceEntityType,
      targetEntityType: dto.targetEntityType,
      relationshipType: dto.relationshipType,
      label: dto.label,
      description: dto.description,
      cardinality: dto.cardinality,
      properties: dto.properties,
    });

    await this.relationshipRepo.create({
      id: relationship.id.value,
      sourceEntityType: relationship.sourceEntityType,
      targetEntityType: relationship.targetEntityType,
      relationshipType: relationship.relationshipType,
      label: relationship.label,
      description: relationship.description ?? null,
      cardinality: relationship.cardinality,
      state: relationship.state,
      properties: relationship.properties,
    });

    return relationship;
  }

  async getRelationshipsByEntityType(entityType: string): Promise<EntityRelationship[]> {
    const relationships = await this.relationshipRepo.findByEntityType(entityType);
    return relationships.map((r: any) => this.toRelationshipDomain(r));
  }

  async getRelationshipsByType(relationshipType: RelationshipType): Promise<EntityRelationship[]> {
    const relationships = await this.relationshipRepo.findByRelationshipType(relationshipType);
    return relationships.map((r: any) => this.toRelationshipDomain(r));
  }

  async getAllRelationships(): Promise<EntityRelationship[]> {
    const relationships = await this.relationshipRepo.findActive();
    return relationships.map((r: any) => this.toRelationshipDomain(r));
  }

  // Ontology query methods

  async getEntityTypeHierarchy(entityType: string): Promise<{
    type: string;
    parentOf: string[];
    childOf: string[];
    has: string[];
    uses: string[];
  }> {
    const relationships = await this.relationshipRepo.findByEntityType(entityType);

    return {
      type: entityType,
      parentOf: relationships
        .filter((r: any) => r.relationship_type === 'IS_A' && r.source_entity_type === entityType)
        .map((r: any) => r.target_entity_type),
      childOf: relationships
        .filter((r: any) => r.relationship_type === 'IS_A' && r.target_entity_type === entityType)
        .map((r: any) => r.source_entity_type),
      has: relationships
        .filter((r: any) => r.relationship_type === 'HAS' && r.source_entity_type === entityType)
        .map((r: any) => r.target_entity_type),
      uses: relationships
        .filter((r: any) => r.relationship_type === 'USES' && r.source_entity_type === entityType)
        .map((r: any) => r.target_entity_type),
    };
  }

  async getEntityTypesByCategory(category: EntityCategory, tenantId: string): Promise<string[]> {
    const entities = await this.entityRepo.findByCategory(category, tenantId);
    const types = new Set<string>(entities.map((e: any) => e.entity_type as string));
    return Array.from(types);
  }

  async countEntitiesByType(tenantId: string): Promise<Record<string, number>> {
    const entities = await this.entityRepo.findByTenant(tenantId);
    const counts: Record<string, number> = {};
    for (const entity of entities) {
      counts[entity.entity_type] = (counts[entity.entity_type] || 0) + 1;
    }
    return counts;
  }

  private toDomain(entity: any): RegisteredEntity {
    return RegisteredEntity.reconstitute({
      id: EntityId.from(entity.id),
      entityType: entity.entity_type,
      entityCategory: entity.entity_category as EntityCategory,
      displayName: entity.display_name,
      tenantId: entity.tenant_id,
      state: entity.state,
      version: entity.version,
      attributes: entity.attributes ?? {},
      tags: entity.tags ? entity.tags.split(',').filter(Boolean) : [],
      parentEntityId: entity.parent_entity_id ?? undefined,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  private toRelationshipDomain(entity: any): EntityRelationship {
    return EntityRelationship.reconstitute({
      id: EntityId.from(entity.id),
      sourceEntityType: entity.source_entity_type,
      targetEntityType: entity.target_entity_type,
      relationshipType: entity.relationship_type as RelationshipType,
      label: entity.label,
      description: entity.description ?? undefined,
      cardinality: entity.cardinality,
      state: entity.state,
      properties: entity.properties ?? {},
    });
  }
}
