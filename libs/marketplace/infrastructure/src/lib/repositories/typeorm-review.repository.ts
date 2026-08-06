import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Review } from '@afri-market/marketplace-domain';
import { IReviewRepository } from '@afri-market/marketplace-domain';
import { ReviewOrmEntity } from '../entities/review-orm.entity';

@Injectable()
export class TypeOrmReviewRepository extends TypeOrmRepository<Review, ReviewOrmEntity, EntityId> implements IReviewRepository {
  constructor(manager: EntityManager) {
    super(manager, ReviewOrmEntity);
  }

  public async findById(id: EntityId): Promise<Review | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByOrderId(orderId: string): Promise<Review | null> {
    const e = await this.repository.findOne({ where: { orderId } });
    return e ? this.toDomain(e) : null;
  }

  public async findByVendorId(vendorId: string): Promise<Review[]> {
    const entities = await this.repository.find({ where: { vendorId } });
    return entities.map(e => this.toDomain(e));
  }

  public async findReviewedOrderIdsByCustomer(customerId: string): Promise<string[]> {
    const entities = await this.repository.find({
      where: { customerId },
      select: { orderId: true },
    });
    return entities.map(e => e.orderId);
  }

  public async save(entity: Review): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as ReviewOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: ReviewOrmEntity): Review {
    return Review.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      customerId: EntityId.from(e.customerId),
      vendorId: EntityId.from(e.vendorId),
      orderId: EntityId.from(e.orderId),
      rating: e.rating,
      comment: e.comment ?? undefined,
    });
  }

  private toOrm(entity: Review): Partial<ReviewOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      customerId: entity.customerId.value,
      vendorId: entity.vendorId.value,
      orderId: entity.orderId.value,
      rating: entity.rating,
      comment: entity.comment ?? null,
    };
  }
}
