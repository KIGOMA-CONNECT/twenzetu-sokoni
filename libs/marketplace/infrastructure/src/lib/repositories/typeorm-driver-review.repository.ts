import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  DriverReview,
  DriverReviewStats,
  IDriverReviewRepository,
} from '@afri-market/marketplace-domain';
import { DriverReviewOrmEntity } from '../entities/driver-review-orm.entity';

@Injectable()
export class TypeOrmDriverReviewRepository extends TypeOrmRepository<DriverReview, DriverReviewOrmEntity, EntityId> implements IDriverReviewRepository {
  constructor(manager: EntityManager) {
    super(manager, DriverReviewOrmEntity);
  }

  public async findById(id: EntityId): Promise<DriverReview | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByDeliveryId(deliveryId: string): Promise<DriverReview | null> {
    const e = await this.repository.findOne({ where: { deliveryId } });
    return e ? this.toDomain(e) : null;
  }

  public async findByDriverId(
    driverId: string,
    options?: { limit: number; offset: number },
  ): Promise<DriverReview[]> {
    const entities = await this.repository.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
    return entities.map(e => this.toDomain(e));
  }

  public async findReviewedDeliveryIdsByCustomer(customerId: string, tenantId: string): Promise<string[]> {
    const entities = await this.repository.find({
      where: { customerId, tenantId },
      select: { deliveryId: true },
    });
    return entities.map(e => e.deliveryId);
  }

  public async statsForDriver(driverId: string, tenantId: string): Promise<DriverReviewStats> {
    const row = await this.repository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.driverId = :driverId', { driverId })
      .andWhere('r.tenantId = :tenantId', { tenantId })
      .getRawOne();
    return {
      averageRating: row?.avg != null ? Number(Number(row.avg).toFixed(1)) : null,
      totalReviews: Number(row?.count ?? 0),
    };
  }

  public async save(entity: DriverReview): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as DriverReviewOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: DriverReviewOrmEntity): DriverReview {
    return DriverReview.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      orderId: EntityId.from(e.orderId),
      deliveryId: EntityId.from(e.deliveryId),
      driverId: EntityId.from(e.driverId),
      customerId: EntityId.from(e.customerId),
      rating: e.rating,
      comment: e.comment ?? undefined,
      createdAt: e.createdAt,
    });
  }

  private toOrm(entity: DriverReview): Partial<DriverReviewOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      orderId: entity.orderId.value,
      deliveryId: entity.deliveryId.value,
      driverId: entity.driverId.value,
      customerId: entity.customerId.value,
      rating: entity.rating,
      comment: entity.comment ?? null,
    };
  }
}
