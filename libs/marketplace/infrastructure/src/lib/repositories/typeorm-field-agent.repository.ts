import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FieldAgent, IFieldAgentRepository, AgentType, AgentStatus } from '@afri-market/marketplace-domain';
import { FieldAgentOrmEntity } from '../entities/field-agent-orm.entity';

@Injectable()
export class TypeOrmFieldAgentRepository extends TypeOrmRepository<FieldAgent, FieldAgentOrmEntity, EntityId> implements IFieldAgentRepository {
  constructor(manager: EntityManager) {
    super(manager, FieldAgentOrmEntity);
  }

  public async findById(id: EntityId): Promise<FieldAgent | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByUserId(userId: string): Promise<FieldAgent | null> {
    const e = await this.repository.findOne({ where: { userId } });
    return e ? this.toDomain(e) : null;
  }

  public async findByAgentCode(code: string): Promise<FieldAgent | null> {
    const e = await this.repository.findOne({ where: { agentCode: code } });
    return e ? this.toDomain(e) : null;
  }

  public async findActiveByTenant(tenantId: string): Promise<FieldAgent[]> {
    const entities = await this.repository.find({ where: { tenantId, status: 'ACTIVE' } });
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: FieldAgent): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as FieldAgentOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: FieldAgentOrmEntity): FieldAgent {
    return FieldAgent.reconstitute(EntityId.from(e.id), {
      tenantId: TenantId.create(e.tenantId),
      userId: EntityId.from(e.userId),
      agentType: e.agentType as AgentType,
      agentCode: e.agentCode,
      coverageArea: e.coverageArea,
      totalOnboarded: e.totalOnboarded,
      totalEarnings: Money.create(Number(e.totalEarnings), e.currency),
      commissionRate: Number(e.commissionRate),
      status: e.status as AgentStatus,
      version: e.version,
    });
  }

  private toOrm(entity: FieldAgent): Partial<FieldAgentOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      userId: entity.userId.value,
      agentType: entity.agentType,
      agentCode: entity.agentCode,
      coverageArea: entity.coverageArea,
      totalOnboarded: entity.totalOnboarded,
      totalEarnings: entity.totalEarnings.amount,
      commissionRate: entity.commissionRate,
      currency: entity.totalEarnings.currency,
      status: entity.status,
      version: entity.version,
    };
  }
}
