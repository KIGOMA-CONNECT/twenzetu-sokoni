import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveCartItemUseCase,
  ClearCartUseCase,
} from '@afri-market/marketplace-application';

const CART = {
  id: 'cart-1',
  vendorId: 'vendor-1',
  currency: 'TZS',
  status: 'ACTIVE',
  itemCount: 2,
  subtotal: 8000,
  items: [{ id: 'ci-1', productId: 'prod-1', productName: 'Rice', quantity: 2, unitPrice: 4000, totalPrice: 8000, currency: 'TZS' }],
};

describe('CartsController', () => {
  let controller: CartsController;
  let getCart: jest.Mocked<GetCartUseCase>;
  let addToCart: jest.Mocked<AddToCartUseCase>;
  let updateCartItem: jest.Mocked<UpdateCartItemUseCase>;
  let removeCartItem: jest.Mocked<RemoveCartItemUseCase>;
  let clearCart: jest.Mocked<ClearCartUseCase>;

  const user = { sub: 'user-1', tenantId: 'tenant-1', role: 'CUSTOMER', phoneNumber: '+255712345678' };

  beforeEach(async () => {
    jest.clearAllMocks();
    getCart = { execute: jest.fn().mockResolvedValue(CART) } as unknown as jest.Mocked<GetCartUseCase>;
    addToCart = { execute: jest.fn().mockResolvedValue(CART) } as unknown as jest.Mocked<AddToCartUseCase>;
    updateCartItem = { execute: jest.fn().mockResolvedValue(CART) } as unknown as jest.Mocked<UpdateCartItemUseCase>;
    removeCartItem = { execute: jest.fn().mockResolvedValue(CART) } as unknown as jest.Mocked<RemoveCartItemUseCase>;
    clearCart = { execute: jest.fn().mockResolvedValue({ ...CART, items: [], itemCount: 0, subtotal: 0 }) } as unknown as jest.Mocked<ClearCartUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        { provide: GetCartUseCase, useValue: getCart },
        { provide: AddToCartUseCase, useValue: addToCart },
        { provide: UpdateCartItemUseCase, useValue: updateCartItem },
        { provide: RemoveCartItemUseCase, useValue: removeCartItem },
        { provide: ClearCartUseCase, useValue: clearCart },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get or create a cart for a vendor', async () => {
    const result = await controller.findCart('vendor-1', user);
    expect(getCart.execute).toHaveBeenCalledWith('tenant-1', 'user-1', 'vendor-1');
    expect(result).toEqual({ data: CART });
  });

  it('should add an item to the cart', async () => {
    const result = await controller.addItem({ productId: 'prod-2', vendorId: 'vendor-1', quantity: 3 }, user);
    expect(addToCart.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: 'user-1',
      vendorId: 'vendor-1',
      productId: 'prod-2',
      quantity: 3,
    });
    expect(result).toEqual({ data: CART });
  });

  it('should update an item quantity', async () => {
    const result = await controller.updateItem('cart-1', 'prod-1', { quantity: 5 }, user);
    expect(updateCartItem.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: 'user-1',
      cartId: 'cart-1',
      productId: 'prod-1',
      quantity: 5,
    });
    expect(result).toEqual({ data: CART });
  });

  it('should remove an item from the cart', async () => {
    const result = await controller.removeItem('cart-1', 'prod-1', user);
    expect(removeCartItem.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: 'user-1',
      cartId: 'cart-1',
      productId: 'prod-1',
    });
    expect(result).toEqual({ data: CART });
  });

  it('should clear the cart', async () => {
    const result = await controller.clear('cart-1', user);
    expect(clearCart.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: 'user-1',
      cartId: 'cart-1',
    });
    expect(result).toEqual({ data: { ...CART, items: [], itemCount: 0, subtotal: 0 } });
  });
});
