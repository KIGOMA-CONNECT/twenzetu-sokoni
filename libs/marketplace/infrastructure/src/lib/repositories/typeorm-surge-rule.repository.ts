import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SurgeRule, ISurgeRuleRepository, SurgeTrigger } from '@afri-market/marketplace-domain';
import { SurgeRuleOrmEntity } from '../entities/surge-rule-orm.entity';

@Injectable()
export class TypeOrmSurgeRuleRepository extends TypeOrmRepository<SurgeRule, SurgeRuleOrmEntity, EntityId> implements ISurgeRuleRepository {
  constructor(manager: EntityManager) {
    super(manager, SurgeRuleOrmEntity);
  }

  public async findById(id: EntityId): Promise<SurgeRule | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findActiveByTenant(tenantId: string): Promise<SurgeRule[]> {
    const entities = await this.repository.find({ where: { tenantId, isActive: true } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findByTrigger(trigger: string, tenantId: string): Promise<SurgeRule | null> {
    const entity = await this.repository.findOne({ where: { trigger, tenantId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async save(entity: SurgeRule): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as SurgeRuleOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: SurgeRuleOrmEntity): SurgeRule {
    return SurgeRule.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      name: e.name,
      trigger: e.trigger as SurgeTrigger,
      multiplier: Number(e.multiplier),
      minOrders: e.minOrders,
      maxDrivers: e.maxDrivers,
      startHour: e.startHour ?? undefined,
      endHour: e.endHour ?? undefined,
      isActive: e.isActive,
      version: e.version,
    });
  }

  private toOrm(entity: SurgeRule): Partial<SurgeRuleOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      name: entity.name,
      trigger: entity.trigger,
      multiplier: entity.multiplier,
      minOrders: entity.minOrders,
      maxDrivers: entity.maxDrivers,
      startHour: entity.startHour ?? null,
      endHour: entity.endHour ?? null,
      isActive: entity.isActive,
      version: entity.version,
    };
  }
}
