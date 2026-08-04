import { Inject, Injectable } from '@nestjs/common';
import { Guard } from '@afri-market/kernel';
import { ICartRepository } from '@afri-market/marketplace-domain';
import { CART_REPOSITORY } from '../../tokens';
import { cartToDto, CartDto } from './get-cart.use-case';

export interface ClearCartInput {
  tenantId: string;
  userId: string;
  cartId: string;
}

@Injectable()
export class ClearCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
  ) {}

  public async execute(input: ClearCartInput): Promise<CartDto> {
    const cart = await this.cartRepo.findByIdAndUser(input.cartId, input.userId, input.tenantId);
    Guard.assert(cart, 'Cart not found');

    cart!.clear();
    await this.cartRepo.save(cart!);
    return cartToDto(cart!);
  }
}
