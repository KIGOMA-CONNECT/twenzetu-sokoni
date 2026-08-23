import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import {
  PosSale,
  PosSaleItem,
  PosPaymentMethod,
  isPosPaymentMethod,
  IProductRepository,
  IProductSaleRepository,
  IPosShiftRepository,
} from '@afri-market/marketplace-domain';
import { PRODUCT_REPOSITORY, PRODUCT_SALE_REPOSITORY, POS_SHIFT_REPOSITORY } from '../../tokens';
import { startOfLocalDay, endOfLocalDay } from './pos-dates';

export interface CreatePosSaleItemInput {
  readonly productId: string;
  readonly quantity: number;
}

export interface CreatePosSaleInput {
  readonly tenantId: string;
  readonly vendorId: string;
  readonly operatorId: string;
  readonly shopName?: string;
  readonly items: CreatePosSaleItemInput[];
  readonly paymentMethod: string;
  readonly amountTendered?: number;
}

@Injectable()
export class CreatePosSaleUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_SALE_REPOSITORY) private readonly saleRepo: IProductSaleRepository,
    @Inject(POS_SHIFT_REPOSITORY) private readonly shiftRepo: IPosShiftRepository,
  ) {}

  public async execute(input: CreatePosSaleInput) {
    if (input.items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }
    if (!isPosPaymentMethod(input.paymentMethod)) {
      throw new Error(`Unsupported payment method: ${input.paymentMethod}`);
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await this.productRepo.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id.value, p]));
    const currency = products[0]?.price.currency ?? 'TZS';

    const saleItems: PosSaleItem[] = [];
    let subtotal = Money.create(0, currency);
    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.vendorId.value !== input.vendorId) {
        throw new Error(`Product "${product.name}" does not belong to this vendor`);
      }
      if (product.status !== 'ACTIVE') {
        throw new Error(`Product "${product.name}" is not available for sale`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}" (only ${product.stockQuantity} left)`);
      }

      const saleItem = PosSaleItem.create({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity: item.quantity,
        unitPrice: product.price,
      });
      saleItems.push(saleItem);
      subtotal = subtotal.add(saleItem.totalPrice);
    }

    const now = new Date();
    const count = await this.saleRepo.countByVendorAndDay(
      input.vendorId,
      startOfLocalDay(now),
      endOfLocalDay(now),
    );

    const discount = Money.create(0, currency);
    const tax = Money.create(0, currency);
    const amountTendered =
      input.amountTendered != null ? Money.create(input.amountTendered, currency) : undefined;

    const sale = PosSale.create({
      tenantId: TenantId.create(input.tenantId),
      vendorId: EntityId.from(input.vendorId),
      operatorId: EntityId.from(input.operatorId),
      saleNumber: this.buildSaleNumber(now, count + 1),
      items: saleItems,
      subtotal,
      discount,
      tax,
      total: subtotal,
      paymentMethod: input.paymentMethod as PosPaymentMethod,
      amountTendered,
    });

    await this.saleRepo.save(sale);

    const openShift = await this.shiftRepo.findOpenByVendor(input.vendorId);
    if (openShift) {
      openShift.recordSale(sale.total.amount, sale.paymentMethod);
      await this.shiftRepo.save(openShift);
    }

    const change = amountTendered ? Math.max(0, amountTendered.amount - sale.total.amount) : 0;

    return {
      sale: sale.toDto(),
      change,
      shiftNumber: openShift?.shiftNumber ?? null,
      receiptText: this.buildReceiptText(sale, input.shopName ?? '', change, openShift?.shiftNumber),
    };
  }

  private buildSaleNumber(date: Date, seq: number): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `POS-${yyyy}${mm}${dd}-${String(seq).padStart(4, '0')}`;
  }

  private buildReceiptText(sale: PosSale, shopName: string, change: number, shiftNumber?: string): string {
    const d = sale.createdAt;
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const line = '-'.repeat(30);

    const lines: string[] = [];
    lines.push('      AFRI MARKET');
    if (shopName) lines.push(`      ${shopName}`);
    lines.push(line);
    lines.push(`Date: ${dateStr}`);
    lines.push(`Time: ${timeStr}`);
    lines.push(`Receipt: ${sale.saleNumber}`);
    if (shiftNumber) lines.push(`Shift: ${shiftNumber}`);
    lines.push(line);
    for (const item of sale.items) {
      lines.push(`${item.productName}`);
      lines.push(`  ${item.quantity} x ${fmt(item.unitPrice.amount)}    ${fmt(item.totalPrice.amount)}`);
    }
    lines.push(line);
    lines.push(`SUBTOTAL            ${fmt(sale.subtotal.amount)}`);
    lines.push(`TOTAL               ${fmt(sale.total.amount)}`);
    lines.push(line);
    lines.push(`PAID (${sale.paymentMethod.toUpperCase().replace(/_/g, ' ')}): ${fmt(sale.total.amount)}`);
    if (change > 0) lines.push(`CHANGE              ${fmt(change)}`);
    lines.push(line);
    lines.push('  Thank you! Come back soon.');
    return lines.join('\n');
  }
}
