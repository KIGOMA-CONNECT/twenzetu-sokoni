import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import {
  Product,
  Vendor,
  IVendorRepository,
  IProductRepository,
  ProductType,
} from '@afri-market/marketplace-domain';
import { PRODUCT_REPOSITORY, VENDOR_REPOSITORY } from '../../tokens';
import { BulkCreateProductsCommand } from '../../commands/bulk-create-products.command';

export interface BulkCreateResult {
  created: Array<{ productId: string; name: string }>;
  failed: Array<{ index: number; name: string; error: string }>;
}

@Injectable()
export class BulkCreateProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: BulkCreateProductsCommand,
    vendorIdOverride?: string,
  ): Promise<BulkCreateResult> {
    let vendor: Vendor | null = null;
    if (vendorIdOverride) {
      vendor = await this.vendorRepo.findById(EntityId.from(vendorIdOverride));
    } else {
      vendor = await this.vendorRepo.findByUserId(command.vendorId);
    }
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const created: BulkCreateResult['created'] = [];
    const failed: BulkCreateResult['failed'] = [];

    for (let i = 0; i < command.products.length; i++) {
      const c = command.products[i];
      try {
        const product = Product.create({
          tenantId: TenantId.create(tenantId),
          vendorId: vendor.id,
          name: c.name,
          description: c.description,
          price: Money.create(c.price, c.currency),
          type: c.type as ProductType,
          categoryId: EntityId.from(c.categoryId),
          imageUrl: c.imageUrl,
          stockQuantity: c.stockQuantity,
          unit: c.unit,
          sku: c.sku,
          barcode: c.barcode,
        });
        await this.productRepo.save(product);
        created.push({ productId: product.id.value, name: product.name });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create product';
        failed.push({ index: i, name: c.name, error: message });
      }
    }

    return { created, failed };
  }
}
