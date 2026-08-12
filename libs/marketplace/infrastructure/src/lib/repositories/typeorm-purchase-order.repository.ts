import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  SupplierOrder,
  SupplierOrderItem,
  SupplierOrderStatus,
  PurchaseOrderPaymentStatus,
  IPurchaseOrderRepository,
} from '@afri-market/marketplace-domain';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order-orm.entity';

interface PoItemSnapshot {
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
}

@Injectable()
export class TypeOrmPurchaseOrderRepository
  extends TypeOrmRepository<SupplierOrder, PurchaseOrderOrmEntity, EntityId>
  implements IPurchaseOrderRepository
{
  constructor(manager: EntityManager) {
    super(manager, PurchaseOrderOrmEntity);
  }

  public async save(order: SupplierOrder): Promise<void> {
    const orm = this.toOrm(order);
    await this.repository.manager.transaction(async (em) => {
      const existing = await em
        .getRepository(PurchaseOrderOrmEntity)
        .createQueryBuilder('po')
        .select('po.status', 'status')
        .where('po.id = :id', { id: order.id.value })
        .getRawOne<{ status: string }>()
        .catch(() => null);

      if (order.status === 'RECEIVED' && existing?.status !== 'RECEIVED') {
        for (const item of order.items) {
          const result = await em.query(
            `UPDATE "products"
                SET "stock_quantity" = "stock_quantity" + $2,
                    "status" = CASE WHEN "stock_quantity" + $2 > 0 AND "status" = 'OUT_OF_STOCK' THEN 'ACTIVE' ELSE "status" END,
                    "updated_at" = NOW()
              WHERE "id" = $1 AND "vendor_id" = $3`,
            [item.productId.value, item.quantity, order.vendorId.value],
          );
          const rowCount = Array.isArray(result) ? Number(result[1] ?? 0) : 0;
          if (rowCount === 0) {
            throw new Error(`Product "${item.productName}" was not found for this vendor`);
          }
        }
      }
      await em.getRepository(PurchaseOrderOrmEntity).save(orm as unknown as PurchaseOrderOrmEntity);
    });
  }

  public async findById(id: EntityId): Promise<SupplierOrder | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByVendorId(vendorId: string): Promise<SupplierOrder[]> {
    const entities = await this.repository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  public async countByVendorAndDay(vendorId: string, start: Date, end: Date): Promise<number> {
    return this.repository
      .createQueryBuilder('po')
      .where('po.vendor_id = :vendorId', { vendorId })
      .andWhere('po.created_at >= :start', { start })
      .andWhere('po.created_at < :end', { end })
      .getCount();
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: PurchaseOrderOrmEntity): SupplierOrder {
    return SupplierOrder.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      operatorId: EntityId.from(e.operatorId),
      supplierId: e.supplierId ?? undefined,
      poNumber: e.poNumber,
      items: (e.items ?? []).map((raw) => {
        const item = raw as PoItemSnapshot;
        return SupplierOrderItem.create({
          productId: EntityId.from(item.productId),
          productName: item.productName,
          sku: item.sku ?? undefined,
          quantity: Number(item.quantity),
          unitCost: Money.create(Number(item.unitCost), e.currency),
        });
      }),
      subtotal: Money.create(Number(e.totalCost), e.currency),
      status: e.status as SupplierOrderStatus,
      paymentStatus: e.paymentStatus as PurchaseOrderPaymentStatus,
      notes: e.notes ?? undefined,
      receivedAt: e.receivedAt ?? undefined,
      confirmedAt: e.confirmedAt ?? undefined,
      completedAt: e.completedAt ?? undefined,
      createdAt: e.createdAt,
      version: e.version,
    });
  }

  private toOrm(order: SupplierOrder): Partial<PurchaseOrderOrmEntity> {
    return {
      id: order.id.value,
      tenantId: order.tenantId.value,
      vendorId: order.vendorId.value,
      operatorId: order.operatorId.value,
      supplierId: order.supplierId ?? null,
      poNumber: order.poNumber,
      totalCost: order.subtotal.amount,
      currency: order.subtotal.currency,
      items: order.items.map((i) => i.toDto()),
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: order.notes ?? null,
      receivedAt: order.receivedAt ?? null,
      confirmedAt: order.confirmedAt ?? null,
      completedAt: order.completedAt ?? null,
      version: order.version,
    };
  }
}