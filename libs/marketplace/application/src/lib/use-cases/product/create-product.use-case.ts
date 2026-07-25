import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import {
  Product,
  IVendorRepository,
  IProductRepository,
  ProductType,
} from '@afri-market/marketplace-domain';
import { PRODUCT_REPOSITORY, VENDOR_REPOSITORY } from '../../tokens';
import { CreateProductCommand } from '../../commands/create-product.command';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: CreateProductCommand,
  ): Promise<{ productId: string }> {
    const vendor = await this.vendorRepo.findById(
      EntityId.from(command.vendorId),
    );
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const product = Product.create({
      tenantId: TenantId.create(tenantId),
      vendorId: EntityId.from(command.vendorId),
      name: command.name,
      description: command.description,
      price: Money.create(command.price, command.currency),
      type: command.type as ProductType,
      categoryId: EntityId.from(command.categoryId),
      imageUrl: command.imageUrl,
      stockQuantity: command.stockQuantity,
      unit: command.unit,
    });

    await this.productRepo.save(product);

    return { productId: product.id.value };
  }
}
