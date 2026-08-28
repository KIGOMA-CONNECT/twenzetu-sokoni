import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { RegisteredEntityOrmEntity } from '../entities/registered-entity-orm.entity';

@Injectable()
export class TypeOrmRegisteredEntityRepository {
  constructor(
    @InjectRepository(RegisteredEntityOrmEntity)
    private readonly repo: Repository<RegisteredEntityOrmEntity>,
  ) {}

  public async create(data: Partial<RegisteredEntityOrmEntity>): Promise<RegisteredEntityOrmEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  public async findById(id: string, tenantId: string): Promise<RegisteredEntityOrmEntity | null> {
    return this.repo.findOne({ where: { id, tenantId } });
  }

  public async findByType(entityType: string, tenantId: string): Promise<RegisteredEntityOrmEntity[]> {
    return this.repo.find({ where: { entityType, tenantId, state: 'ACTIVE' } });
  }

  public async findByCategory(entityCategory: string, tenantId: string): Promise<RegisteredEntityOrmEntity[]> {
    return this.repo.find({ where: { entityCategory, tenantId, state: 'ACTIVE' } });
  }

  public async findByTenant(tenantId: string): Promise<RegisteredEntityOrmEntity[]> {
    return this.repo.find({ where: { tenantId, state: 'ACTIVE' } });
  }

  public async findByState(state: string, tenantId: string): Promise<RegisteredEntityOrmEntity[]> {
    return this.repo.find({ where: { state, tenantId } });
  }

  public async findByTag(tag: string, tenantId: string): Promise<RegisteredEntityOrmEntity[]> {
    return this.repo
      .createQueryBuilder('entity')
      .where('entity.tenant_id = :tenantId', { tenantId })
      .andWhere('entity.state = :state', { state: 'ACTIVE' })
      .andWhere(':tag = ANY(string_to_array(entity.tags, \',\'))', { tag })
      .getMany();
  }

  public async findByEntityTypeAndTenant(entityType: string, tenantId: string): Promise<RegisteredEntityOrmEntity | null> {
    return this.repo.findOne({ where: { entityType, tenantId, state: 'ACTIVE' } });
  }

  public async countByTenant(tenantId: string): Promise<number> {
    return this.repo.count({ where: { tenantId, state: 'ACTIVE' } });
  }

  public async countByType(entityType: string, tenantId: string): Promise<number> {
    return this.repo.count({ where: { entityType, tenantId, state: 'ACTIVE' } });
  }

  public async search(query: string, tenantId: string): Promise<RegisteredEntityOrmEntity[]> {
    return this.repo.find({
      where: {
        tenantId,
        state: 'ACTIVE',
        displayName: Like(`%${query}%`),
      },
      take: 50,
    });
  }

  public async save(entity: Partial<RegisteredEntityOrmEntity>): Promise<RegisteredEntityOrmEntity> {
    return this.repo.save(entity);
  }

  public async delete(id: string, tenantId: string): Promise<void> {
    await this.repo.delete({ id, tenantId });
  }
}
