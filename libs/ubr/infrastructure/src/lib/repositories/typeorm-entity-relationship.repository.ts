import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRelationshipOrmEntity } from '../entities/entity-relationship-orm.entity';

@Injectable()
export class TypeOrmEntityRelationshipRepository {
  constructor(
    @InjectRepository(EntityRelationshipOrmEntity)
    private readonly repo: Repository<EntityRelationshipOrmEntity>,
  ) {}

  public async create(data: Partial<EntityRelationshipOrmEntity>): Promise<EntityRelationshipOrmEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  public async findById(id: string): Promise<EntityRelationshipOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async findBySourceEntityType(sourceEntityType: string): Promise<EntityRelationshipOrmEntity[]> {
    return this.repo.find({ where: { sourceEntityType, state: 'ACTIVE' } });
  }

  public async findByTargetEntityType(targetEntityType: string): Promise<EntityRelationshipOrmEntity[]> {
    return this.repo.find({ where: { targetEntityType, state: 'ACTIVE' } });
  }

  public async findByRelationshipType(relationshipType: string): Promise<EntityRelationshipOrmEntity[]> {
    return this.repo.find({ where: { relationshipType, state: 'ACTIVE' } });
  }

  public async findByEntityType(entityType: string): Promise<EntityRelationshipOrmEntity[]> {
    return this.repo
      .createQueryBuilder('rel')
      .where('(rel.source_entity_type = :entityType OR rel.target_entity_type = :entityType)', { entityType })
      .andWhere('rel.state = :state', { state: 'ACTIVE' })
      .getMany();
  }

  public async findActive(): Promise<EntityRelationshipOrmEntity[]> {
    return this.repo.find({ where: { state: 'ACTIVE' } });
  }

  public async save(entity: Partial<EntityRelationshipOrmEntity>): Promise<EntityRelationshipOrmEntity> {
    return this.repo.save(entity);
  }

  public async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
