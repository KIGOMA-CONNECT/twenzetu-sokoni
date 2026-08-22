import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Cart, Product } from '@afri-market/marketplace-domain';
import { CheckoutCartUseCase } from './checkout-cart.use-case';

function makeProduct(id: string, price: number, stock: number, status = 'ACTIVE'): Product {
  return Product.reconstitute({
    id: EntityId.from(id),
    tenantId: TenantId.create('t-1'),
    vendorId: EntityId.from('vendor-1'),
    name: `Product ${id}`,
    description: '',
    price: Money.create(price, 'TZS'),
    type: 'food',
    categoryId: undefined,
    imageUrl: undefined,
    stockQuantity: stock,
    unit: 'piece',
    status: status as Product['status'],
    version: 1,
  });
}

function makeCart(status: 'ACTIVE' | 'CHECKED_OUT' = 'ACTIVE'): Cart {
  return Cart.reconstitute({
    id: EntityId.from('cart-1'),
    tenantId: TenantId.create('t-1'),
    userId: EntityId.from('user-1'),
    vendorId: EntityId.from('vendor-1'),
    currency: 'TZS',
    status,
    items: [
      {
        id: 'ci-1',
        productId: EntityId.from('prod-1'),
        productName: 'Rice',
        quantity: 2,
        unitPrice: Money.create(4000, 'TZS'),
      } as never,
    ],
  });
}

describe('CheckoutCartUseCase', () => {
  const vendor = {
    status: 'ACTIVE',
    latitude: -6.8161,
    longitude: 39.2803,
    commissionRate: 0.1,
  };

  const baseInput = {
    tenantId: 't-1',
    userId: 'user-1',
    cartId: 'cart-1',
    paymentMethod: 'cash',
    deliveryAddress: 'Dar es Salaam',
    customerPhone: '+255712345678',
    currency: 'TZS',
  };

  function build(overrides: { cart?: Cart | null; products?: Map<string, Product> } = {}) {
    const cart = overrides.cart ?? makeCart();
    const products = overrides.products ?? new Map<string, Product>([
      ['prod-1', makeProduct('prod-1', 4000, 10)],
    ]);

    const cartRepo = {
      findByIdAndUser: jest.fn().mockResolvedValue(cart),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const productRepo = {
      findById: jest.fn((id: EntityId) => Promise.resolve(products.get(id.value) ?? null)),
      findByIds: jest.fn((ids: string[]) =>
        Promise.resolve(ids.map((id) => products.get(id)).filter((p) => p !== undefined)),
      ),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const vendorRepo = { findById: jest.fn().mockResolvedValue(vendor) };
    const orderRepo = { save: jest.fn().mockResolvedValue(undefined), delete: jest.fn().mockResolvedValue(undefined) };
    const paymentRepo = { save: jest.fn().mockResolvedValue(undefined), delete: jest.fn().mockResolvedValue(undefined) };
    const ds = {
      query: jest.fn((sql: string) => {
        if (sql.includes('UPDATE products')) {
          return Promise.resolve([{ id: 'prod-1' }]);
        }
        if (sql.includes('UPDATE carts')) {
          return Promise.resolve([{ id: 'cart-1' }]);
        }
        return Promise.resolve([]);
      }),
      transaction: jest.fn(async (cb: (em: { query: (sql: string) => Promise<unknown> }) => Promise<void>) => {
        await cb({
          query: jest.fn((sql: string) => {
            if (sql.includes('UPDATE products')) {
              return Promise.resolve([{ id: 'prod-1' }]);
            }
            return Promise.resolve([]);
          }),
        });
      }),
    };
    const mobileMoneyService = {
      initiateStkPush: jest.fn().mockResolvedValue({ checkoutRequestId: 'ws-123', responseCode: '0' }),
    };
    const smsService = { sendDeliveryOtp: jest.fn().mockResolvedValue(undefined) };
    const emailService = { sendOrderConfirmation: jest.fn().mockResolvedValue(undefined) };
    const gateway = { notifyNewOrder: jest.fn() };

    const useCase = new CheckoutCartUseCase(
      cartRepo as never,
      productRepo as never,
      vendorRepo as never,
      orderRepo as never,
      paymentRepo as never,
      ds as never,
      gateway as never,
      smsService as never,
      emailService as never,
      mobileMoneyService as never,
    );

    return { useCase, cartRepo, productRepo, vendorRepo, orderRepo, paymentRepo, ds, mobileMoneyService, smsService, emailService, gateway, cart };
  }

  it('creates an order, persists order items, reduces stock and checks the cart out', async () => {
    const { useCase, cartRepo, productRepo, ds, orderRepo, paymentRepo, gateway, cart } = build();

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe('PLACED');
    expect(result.total).toBe(8000);
    expect(result.paymentStatus).toBe('ESCROW_HELD');

    expect(orderRepo.save).toHaveBeenCalledTimes(1);
    expect(paymentRepo.save).toHaveBeenCalledTimes(2);

    expect(ds.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO order_items'),
      expect.arrayContaining(['t-1', 'prod-1', 'Product prod-1', 2, 4000, 8000, 'TZS']),
    );

    const savedProduct = productRepo.save.mock.calls[0]?.[0] as Product | undefined;
    expect(savedProduct).toBeUndefined();

    // Stock is claimed inside a transaction before any order rows are written.
    expect(ds.transaction).toHaveBeenCalledTimes(1);
    expect(ds.query).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE products'),
      expect.anything(),
    );

    expect(cart.status).toBe('CHECKED_OUT');
    expect(cartRepo.save).toHaveBeenCalledWith(cart);
    expect(gateway.notifyNewOrder).toHaveBeenCalled();
  });

  it('throws when the cart is empty', async () => {
    const cart = makeCart();
    (cart as unknown as { clear(): void }).clear();
    const { useCase } = build({ cart });

    await expect(useCase.execute(baseInput)).rejects.toThrow('Cart is empty');
  });

  it('throws when a product has insufficient stock', async () => {
    const products = new Map<string, Product>([
      ['prod-1', makeProduct('prod-1', 4000, 1)],
    ]);
    const { useCase } = build({ products });

    await expect(useCase.execute(baseInput)).rejects.toThrow('Insufficient stock for Rice');
  });

  it('re-prices items from the products table at checkout', async () => {
    const products = new Map<string, Product>([
      ['prod-1', makeProduct('prod-1', 5000, 10)],
    ]);
    const { useCase, ds } = build({ products });

    await useCase.execute(baseInput);

    expect(ds.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO order_items'),
      expect.arrayContaining([5000, 10000, 'TZS']),
    );
  });

  it('initiates STK push for mobile money payment methods', async () => {
    const { useCase, mobileMoneyService } = build();
    const result = await useCase.execute({ ...baseInput, paymentMethod: 'tigo_pesa' });

    expect(mobileMoneyService.initiateStkPush).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'tigo_pesa', amount: 8000, accountReference: result.orderId }),
    );
  });

  it('rejects a second concurrent checkout for the same cart', async () => {
    const { useCase, ds, orderRepo } = build();
    ds.query.mockImplementation((sql: string) => {
      if (sql.includes('UPDATE products')) {
        return Promise.resolve([{ id: 'prod-1' }]);
      }
      if (sql.includes('UPDATE carts')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(useCase.execute(baseInput)).rejects.toThrow('Cart has already been checked out');
    expect(orderRepo.save).not.toHaveBeenCalled();
  });
});
