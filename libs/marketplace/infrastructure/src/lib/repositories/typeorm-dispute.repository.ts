import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Dispute, IDisputeRepository, DisputeSearchFilters, DisputeReason, DisputeStatus, DisputeSeverity, DisputeResolutionType } from '@afri-market/marketplace-domain';
import { DisputeOrmEntity } from '../entities/dispute-orm.entity';

@Injectable()
export class TypeOrmDisputeRepository extends TypeOrmRepository<Dispute, DisputeOrmEntity, EntityId> implements IDisputeRepository {
  constructor(manager: EntityManager) {
    super(manager, DisputeOrmEntity);
  }

  public async findById(id: EntityId): Promise<Dispute | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByOrderId(orderId: string): Promise<Dispute | null> {
    const entity = await this.repository.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByCustomerId(customerId: string): Promise<Dispute[]> {
    const entities = await this.repository.find({ where: { customerId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findOpenByVendor(vendorId: string): Promise<Dispute[]> {
    const entities = await this.repository.find({ where: { vendorId, status: 'OPEN' } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findEscalated(): Promise<Dispute[]> {
    const entities = await this.repository.find({ where: { status: 'ESCALATED_TO_HUMAN' } });
    return entities.map((e) => this.toDomain(e));
  }

  public async countByTenant(tenantId: string, status?: string): Promise<number> {
    const where: FindOptionsWhere<DisputeOrmEntity> = { tenantId };
    if (status) where.status = status;
    return this.repository.count({ where });
  }

  public async search(tenantId: string, filters: DisputeSearchFilters = {}): Promise<{ data: Dispute[]; total: number }> {
    const qb = this.repository.createQueryBuilder('d')
      .where('d.tenant_id = :tenantId', { tenantId });
    if (filters.status) {
      qb.andWhere('d.status = :status', { status: filters.status });
    }
    qb.orderBy('d.created_at', 'DESC')
      .take(filters.limit ?? 50)
      .skip(filters.offset ?? 0);
    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  public async save(entity: Dispute): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as DisputeOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: DisputeOrmEntity): Dispute {
    return Dispute.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      orderId: EntityId.from(e.orderId),
      customerId: EntityId.from(e.customerId),
      vendorId: EntityId.from(e.vendorId),
      reason: e.reason as DisputeReason,
      description: e.description,
      claimAmount: Money.create(Number(e.claimAmount), e.currency),
      status: e.status as DisputeStatus,
      severity: e.severity as DisputeSeverity,
      fraudScore: e.fraudScore ?? undefined,
      assignedAgentId: e.assignedAgentId ? EntityId.from(e.assignedAgentId) : undefined,
      resolutionType: e.resolutionType as DisputeResolutionType ?? undefined,
      resolvedAmount: e.resolvedAmount != null ? Money.create(Number(e.resolvedAmount), e.currency) : undefined,
      resolutionNotes: e.resolutionNotes ?? undefined,
      pickupPhotoUrl: e.pickupPhotoUrl ?? undefined,
      deliveryPhotoUrl: e.deliveryPhotoUrl ?? undefined,
      disputePhotoUrl: e.disputePhotoUrl ?? undefined,
      geolocationLat: e.geolocationLat ?? undefined,
      geolocationLng: e.geolocationLng ?? undefined,
      version: e.version,
    });
  }

  private toOrm(entity: Dispute): Partial<DisputeOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      orderId: entity.orderId.value,
      customerId: entity.customerId.value,
      vendorId: entity.vendorId.value,
      reason: entity.reason,
      description: entity.description,
      claimAmount: entity.claimAmount.amount,
      currency: entity.claimAmount.currency,
      status: entity.status,
      severity: entity.severity,
      fraudScore: entity.fraudScore ?? null,
      assignedAgentId: entity.assignedAgentId?.value ?? null,
      resolutionType: entity.resolutionType ?? null,
      resolvedAmount: entity.resolvedAmount?.amount ?? null,
      resolutionNotes: entity.resolutionNotes ?? null,
      pickupPhotoUrl: null,
      deliveryPhotoUrl: null,
      disputePhotoUrl: null,
      geolocationLat: null,
      geolocationLng: null,
      version: entity.version,
    };
  }
}
