import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Guard, TenantId } from '@afri-market/kernel';
import {
  Cart,
  ICartRepository,
  IProductRepository,
} from '@afri-market/marketplace-domain';
import { CART_REPOSITORY, PRODUCT_REPOSITORY } from '../../tokens';
import { cartToDto, CartDto } from './get-cart.use-case';

export interface AddToCartInput {
  tenantId: string;
  userId: string;
  vendorId: string;
  productId: string;
  quantity: number;
}

@Injectable()
export class AddToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  public async execute(input: AddToCartInput): Promise<CartDto> {
    Guard.assert(input.quantity > 0, 'Quantity must be positive');

    const product = await this.productRepo.findById(EntityId.from(input.productId));
    Guard.assert(product, 'Product not found');
    Guard.assert(product!.status === 'ACTIVE', 'Product is not available');
    Guard.assert(product!.vendorId.value === input.vendorId, 'Product does not belong to this vendor');
    Guard.assert(product!.stockQuantity >= input.quantity, 'Insufficient stock');

    let cart = await this.cartRepo.findActiveByUserAndVendor(input.tenantId, input.userId, input.vendorId);
    if (!cart) {
      cart = Cart.create({
        tenantId: TenantId.create(input.tenantId),
        userId: EntityId.from(input.userId),
        vendorId: EntityId.from(input.vendorId),
        currency: product!.price.currency,
      });
    }

    cart.addItem(
      {
        id: product!.id.value,
        name: product!.name,
        price: product!.price,
        stockQuantity: product!.stockQuantity,
      },
      input.quantity,
    );

    await this.cartRepo.save(cart);
    return cartToDto(cart);
  }
}
