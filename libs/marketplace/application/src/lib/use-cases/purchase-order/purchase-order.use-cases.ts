import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import {
  SupplierOrder,
  SupplierOrderItem,
  IProductRepository,
  IPurchaseOrderRepository,
} from '@afri-market/marketplace-domain';
import { PRODUCT_REPOSITORY, PURCHASE_ORDER_REPOSITORY } from '../../tokens';
import { startOfLocalDay, endOfLocalDay } from '../pos/pos-dates';

export interface CreatePurchaseOrderItemInput {
  readonly productId: string;
  readonly quantity: number;
  readonly unitCost: number;
}

export interface CreatePurchaseOrderInput {
  readonly tenantId: string;
  readonly vendorId: string;
  readonly operatorId: string;
  readonly supplierId?: string;
  readonly items: CreatePurchaseOrderItemInput[];
  readonly notes?: string;
}

@Injectable()
export class CreatePurchaseOrderUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: IPurchaseOrderRepository,
  ) {}

  public async execute(input: CreatePurchaseOrderInput) {
    if (input.items.length === 0) {
      throw new Error('Purchase order must contain at least one item');
    }
    if (input.items.some((i) => i.quantity <= 0)) {
      throw new Error('Quantity must be positive');
    }
    if (input.items.some((i) => i.unitCost < 0)) {
      throw new Error('Unit cost cannot be negative');
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await this.productRepo.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id.value, p]));
    const currency = products[0]?.price.currency ?? 'TZS';

    const poItems: SupplierOrderItem[] = [];
    let subtotal = Money.create(0, currency);
    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.vendorId.value !== input.vendorId) {
        throw new Error(`Product "${product.name}" does not belong to this vendor`);
      }
      const poItem = SupplierOrderItem.create({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitCost: Money.create(item.unitCost, currency),
      });
      poItems.push(poItem);
      subtotal = subtotal.add(poItem.totalCost);
    }

    const now = new Date();
    const count = await this.poRepo.countByVendorAndDay(
      input.vendorId,
      startOfLocalDay(now),
      endOfLocalDay(now),
    );

    const po = SupplierOrder.create({
      tenantId: TenantId.create(input.tenantId),
      vendorId: EntityId.from(input.vendorId),
      operatorId: EntityId.from(input.operatorId),
      supplierId: input.supplierId?.trim() || undefined,
      poNumber: this.buildPoNumber(now, count + 1),
      items: poItems,
      subtotal,
      notes: input.notes?.trim() || undefined,
    });

    await this.poRepo.save(po);
    return { order: po.toDto() };
  }

  private buildPoNumber(date: Date, seq: number): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `PO-${yyyy}${mm}${dd}-${String(seq).padStart(4, '0')}`;
  }
}

@Injectable()
export class ListPurchaseOrdersUseCase {
  constructor(@Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: IPurchaseOrderRepository) {}

  public async execute(vendorId: string) {
    const orders = await this.poRepo.findByVendorId(vendorId);
    return orders.map((o) => o.toDto());
  }
}

@Injectable()
export class ReceivePurchaseOrderUseCase {
  constructor(@Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: IPurchaseOrderRepository) {}

  public async execute(input: { vendorId: string; poId: string }) {
    const po = await this.poRepo.findById(EntityId.from(input.poId));
    if (!po || po.vendorId.value !== input.vendorId) {
      throw new NotFoundException('Purchase order not found');
    }
    po.receive();
    await this.poRepo.save(po);
    return { order: po.toDto() };
  }
}

@Injectable()
export class CancelPurchaseOrderUseCase {
  constructor(@Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: IPurchaseOrderRepository) {}

  public async execute(input: { vendorId: string; poId: string }) {
    const po = await this.poRepo.findById(EntityId.from(input.poId));
    if (!po || po.vendorId.value !== input.vendorId) {
      throw new NotFoundException('Purchase order not found');
    }
    po.cancel();
    await this.poRepo.save(po);
    return { order: po.toDto() };
  }
}

@Injectable()
export class ConfirmPurchaseOrderUseCase {
  constructor(@Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: IPurchaseOrderRepository) {}

  public async execute(input: { vendorId: string; poId: string }) {
    const po = await this.poRepo.findById(EntityId.from(input.poId));
    if (!po || po.vendorId.value !== input.vendorId) {
      throw new NotFoundException('Purchase order not found');
    }
    po.confirm();
    await this.poRepo.save(po);
    return { order: po.toDto() };
  }
}

@Injectable()
export class CompletePurchaseOrderUseCase {
  constructor(@Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: IPurchaseOrderRepository) {}

  public async execute(input: { vendorId: string; poId: string }) {
    const po = await this.poRepo.findById(EntityId.from(input.poId));
    if (!po || po.vendorId.value !== input.vendorId) {
      throw new NotFoundException('Purchase order not found');
    }
    po.complete();
    await this.poRepo.save(po);
    return { order: po.toDto() };
  }
}

@Injectable()
export class SetPurchaseOrderPaymentUseCase {
  constructor(@Inject(PURCHASE_ORDER_REPOSITORY) private readonly poRepo: IPurchaseOrderRepository) {}

  public async execute(input: { vendorId: string; poId: string; paid: boolean }) {
    const po = await this.poRepo.findById(EntityId.from(input.poId));
    if (!po || po.vendorId.value !== input.vendorId) {
      throw new NotFoundException('Purchase order not found');
    }
    if (input.paid) {
      po.markPaid();
    } else {
      po.markUnpaid();
    }
    await this.poRepo.save(po);
    return { order: po.toDto() };
  }
}