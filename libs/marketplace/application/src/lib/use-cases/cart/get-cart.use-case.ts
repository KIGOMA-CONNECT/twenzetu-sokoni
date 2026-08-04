import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Cart, CartStatus, ICartRepository } from '@afri-market/marketplace-domain';
import { CART_REPOSITORY } from '../../tokens';

export interface CartDto {
  id: string;
  vendorId: string;
  currency: string;
  status: CartStatus;
  itemCount: number;
  subtotal: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
  }>;
}

export function cartToDto(cart: Cart): CartDto {
  return {
    id: cart.id.value,
    vendorId: cart.vendorId.value,
    currency: cart.currency,
    status: cart.status,
    itemCount: cart.itemCount,
    subtotal: cart.subtotal.amount,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId.value,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.amount,
      totalPrice: item.totalPrice.amount,
      currency: item.unitPrice.currency,
    })),
  };
}

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
  ) {}

  public async execute(tenantId: string, userId: string, vendorId: string): Promise<CartDto> {
    let cart = await this.cartRepo.findActiveByUserAndVendor(tenantId, userId, vendorId);
    if (!cart) {
      cart = Cart.create({
        tenantId: TenantId.create(tenantId),
        userId: EntityId.from(userId),
        vendorId: EntityId.from(vendorId),
      });
      await this.cartRepo.save(cart);
    }
    return cartToDto(cart);
  }
}
