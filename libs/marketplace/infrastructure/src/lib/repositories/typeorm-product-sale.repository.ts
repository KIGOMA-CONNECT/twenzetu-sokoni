import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { Between, EntityManager } from 'typeorm';
import {
  PosSale,
  PosSaleItem,
  PosPaymentMethod,
  PosSaleStatus,
  IProductSaleRepository,
} from '@afri-market/marketplace-domain';
import { ProductSaleOrmEntity } from '../entities/product-sale-orm.entity';

interface PosItemSnapshot {
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

@Injectable()
export class TypeOrmProductSaleRepository
  extends TypeOrmRepository<PosSale, ProductSaleOrmEntity, EntityId>
  implements IProductSaleRepository
{
  constructor(manager: EntityManager) {
    super(manager, ProductSaleOrmEntity);
  }

  public async save(sale: PosSale): Promise<void> {
    const orm = this.toOrm(sale);
    await this.repository.manager.transaction(async (em) => {
      for (const item of sale.items) {
        const result = await em.query(
          `UPDATE "products"
              SET "stock_quantity" = "stock_quantity" - $2,
                  "status" = CASE WHEN "stock_quantity" - $2 <= 0 THEN 'OUT_OF_STOCK' ELSE "status" END,
                  "updated_at" = NOW()
            WHERE "id" = $1 AND "vendor_id" = $3 AND "status" = 'ACTIVE' AND "stock_quantity" >= $2`,
          [item.productId.value, item.quantity, sale.vendorId.value],
        );
        const rowCount = Array.isArray(result) ? Number(result[1] ?? 0) : 0;
        if (rowCount === 0) {
          throw new Error(`Insufficient stock for "${item.productName}"`);
        }
      }
      await em.getRepository(ProductSaleOrmEntity).save(orm as unknown as ProductSaleOrmEntity);
    });
  }

  public async countByVendorAndDay(vendorId: string, start: Date, end: Date): Promise<number> {
    return this.repository
      .createQueryBuilder('s')
      .where('s.vendor_id = :vendorId', { vendorId })
      .andWhere('s.created_at >= :start', { start })
      .andWhere('s.created_at < :end', { end })
      .getCount();
  }

  public async findByVendorBetween(vendorId: string, start: Date, end: Date): Promise<PosSale[]> {
    const entities = await this.repository.find({
      where: { vendorId, createdAt: Between(start, end) },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  public async findById(id: EntityId): Promise<PosSale | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: ProductSaleOrmEntity): PosSale {
    return PosSale.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      operatorId: EntityId.from(e.operatorId),
      saleNumber: e.saleNumber,
      items: (e.items ?? []).map((raw) => {
        const item = raw as PosItemSnapshot;
        return PosSaleItem.create({
          productId: EntityId.from(item.productId),
          productName: item.productName,
          sku: item.sku ?? undefined,
          barcode: item.barcode ?? undefined,
          quantity: Number(item.quantity),
          unitPrice: Money.create(Number(item.unitPrice), e.currency),
        });
      }),
      subtotal: Money.create(Number(e.subtotal), e.currency),
      discount: Money.create(Number(e.discount), e.currency),
      tax: Money.create(Number(e.tax), e.currency),
      total: Money.create(Number(e.total), e.currency),
      paymentMethod: e.paymentMethod as PosPaymentMethod,
      amountTendered: e.amountTendered == null ? undefined : Money.create(Number(e.amountTendered), e.currency),
      status: e.status as PosSaleStatus,
      createdAt: e.createdAt,
      version: e.version,
    });
  }

  private toOrm(sale: PosSale): Partial<ProductSaleOrmEntity> {
    return {
      id: sale.id.value,
      tenantId: sale.tenantId.value,
      vendorId: sale.vendorId.value,
      operatorId: sale.operatorId.value,
      saleNumber: sale.saleNumber,
      subtotal: sale.subtotal.amount,
      discount: sale.discount.amount,
      tax: sale.tax.amount,
      total: sale.total.amount,
      currency: sale.total.currency,
      paymentMethod: sale.paymentMethod,
      amountTendered: sale.amountTendered?.amount ?? null,
      items: sale.items.map((i) => i.toDto()),
      status: sale.status,
      version: sale.version,
    };
  }
}