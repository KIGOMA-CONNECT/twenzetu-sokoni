import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Guard } from '@afri-market/kernel';
import { ICartRepository, IProductRepository } from '@afri-market/marketplace-domain';
import { CART_REPOSITORY, PRODUCT_REPOSITORY } from '../../tokens';
import { cartToDto, CartDto } from './get-cart.use-case';

export interface UpdateCartItemInput {
  tenantId: string;
  userId: string;
  cartId: string;
  productId: string;
  quantity: number;
}

@Injectable()
export class UpdateCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  public async execute(input: UpdateCartItemInput): Promise<CartDto> {
    const cart = await this.cartRepo.findByIdAndUser(input.cartId, input.userId, input.tenantId);
    Guard.assert(cart, 'Cart not found');

    const product = await this.productRepo.findById(EntityId.from(input.productId));
    const availableStock = product?.status === 'ACTIVE' ? product.stockQuantity : 0;

    const changed = cart!.updateItemQuantity(input.productId, input.quantity, availableStock);
    Guard.assert(changed, 'Item not found in cart');

    await this.cartRepo.save(cart!);
    return cartToDto(cart!);
  }
}
