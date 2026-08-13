import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import {
  Vendor,
  IVendorRepository,
  IProductRepository,
  ProductType,
  ProductStatus,
} from '@afri-market/marketplace-domain';
import { PRODUCT_REPOSITORY, VENDOR_REPOSITORY } from '../../tokens';
import { UpdateProductCommand } from '../../commands/update-product.command';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: UpdateProductCommand,
    vendorIdOverride?: string,
  ): Promise<{ productId: string }> {
    let vendor: Vendor | null = null;
    if (vendorIdOverride) {
      vendor = await this.vendorRepo.findById(EntityId.from(vendorIdOverride));
    } else {
      vendor = await this.vendorRepo.findByUserId(command.updaterUserId);
    }
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const product = await this.productRepo.findById(EntityId.from(command.productId));
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.vendorId.value !== vendor.id.value) {
      throw new Error('Not authorized to update this product');
    }

    product.update({
      name: command.name,
      description: command.description,
      price: command.price !== undefined
        ? Money.create(command.price, command.currency ?? product.price.currency)
        : undefined,
      type: command.type as ProductType | undefined,
      categoryId: command.categoryId ? EntityId.from(command.categoryId) : undefined,
      imageUrl: command.imageUrl,
      stockQuantity: command.stockQuantity,
      unit: command.unit,
      sku: command.sku,
      barcode: command.barcode,
      status: command.status as ProductStatus | undefined,
    });

    await this.productRepo.save(product);

    return { productId: product.id.value };
  }
}
