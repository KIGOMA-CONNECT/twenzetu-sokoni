import { CancelOrderUseCase } from '../lib/use-cases/order/cancel-order.use-case';
import { VendorUpdateOrderStatusUseCase } from '../lib/use-cases/vendor/vendor-update-order-status.use-case';
import { UpdateOrderStatusUseCase } from '../lib/use-cases/order/update-order-status.use-case';
import { UpdateOrderStatusCommand } from '../lib/commands/update-order-status.command';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Order, OrderStatus } from '@afri-market/marketplace-domain';

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockOrderRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const ORDER_ID = 'order-123';
  const CUSTOMER_ID = 'customer-456';

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepo = { findByIdAndTenant: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new CancelOrderUseCase(mockOrderRepo);
  });

  const createOrder = (status: string = 'PLACED') =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      vendorId: EntityId.from('vendor-789'),
      driverId: undefined,
      type: 'food',
      status: status as OrderStatus,
      subtotal: Money.create(5000),
      deliveryFee: Money.create(1000),
      systemCommission: Money.create(500),
      totalAmount: Money.create(6000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      version: 1,
    });

  it('should cancel a PLACED order', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    const result = await useCase.execute(TENANT_ID, ORDER_ID, CUSTOMER_ID, 'Changed mind');

    expect(result.status).toBe('CANCELLED');
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should cancel a CONFIRMED order', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('CONFIRMED'));

    const result = await useCase.execute(TENANT_ID, ORDER_ID, CUSTOMER_ID);

    expect(result.status).toBe('CANCELLED');
  });

  it('should throw if order not found', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(null);

    await expect(useCase.execute(TENANT_ID, ORDER_ID, CUSTOMER_ID)).rejects.toThrow('not found');
  });

  it('should throw if not own order', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    await expect(useCase.execute(TENANT_ID, ORDER_ID, 'other-customer')).rejects.toThrow('only cancel your own');
  });

  it('should throw if order status is DELIVERED', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('DELIVERED'));

    await expect(useCase.execute(TENANT_ID, ORDER_ID, CUSTOMER_ID)).rejects.toThrow('cannot be cancelled');
  });
});

describe('VendorUpdateOrderStatusUseCase', () => {
  let useCase: VendorUpdateOrderStatusUseCase;
  let mockOrderRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const ORDER_ID = 'order-123';
  const VENDOR_ID = 'vendor-789';

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepo = { findByIdAndTenant: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new VendorUpdateOrderStatusUseCase(mockOrderRepo);
  });

  const createOrder = (status: string) =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from('customer-456'),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: undefined,
      type: 'food',
      status: status as OrderStatus,
      subtotal: Money.create(5000),
      deliveryFee: Money.create(1000),
      systemCommission: Money.create(500),
      totalAmount: Money.create(6000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      version: 1,
    });

  it('should transition PLACED to CONFIRMED', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    const result = await useCase.execute(TENANT_ID, ORDER_ID, VENDOR_ID, 'CONFIRMED');

    expect(result.status).toBe('CONFIRMED');
  });

  it('should transition CONFIRMED to PREPARING', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('CONFIRMED'));

    const result = await useCase.execute(TENANT_ID, ORDER_ID, VENDOR_ID, 'PREPARING');

    expect(result.status).toBe('PREPARING');
  });

  it('should throw on invalid transition', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    await expect(useCase.execute(TENANT_ID, ORDER_ID, VENDOR_ID, 'DELIVERED')).rejects.toThrow('Cannot transition');
  });

  it('should throw if order not found', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(null);

    await expect(useCase.execute(TENANT_ID, ORDER_ID, VENDOR_ID, 'CONFIRMED')).rejects.toThrow('not found');
  });

  it('should throw if not own order', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    await expect(useCase.execute(TENANT_ID, ORDER_ID, 'other-vendor', 'CONFIRMED')).rejects.toThrow('only update orders assigned');
  });
});

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let mockOrderRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const ORDER_ID = 'order-123';
  const VENDOR_ID = 'vendor-789';

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepo = { findByIdAndTenant: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateOrderStatusUseCase(mockOrderRepo);
  });

  const createOrder = (status: string) =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from('customer-456'),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: undefined,
      type: 'food',
      status: status as OrderStatus,
      subtotal: Money.create(5000),
      deliveryFee: Money.create(1000),
      systemCommission: Money.create(500),
      totalAmount: Money.create(6000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      version: 1,
    });

  it('should allow owning vendor to transition order', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    const result = await useCase.execute(TENANT_ID, new UpdateOrderStatusCommand(ORDER_ID, 'CONFIRMED'), { role: 'vendor', vendorId: VENDOR_ID });

    expect(result.status).toBe('CONFIRMED');
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should allow admins to transition order', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    const result = await useCase.execute(TENANT_ID, new UpdateOrderStatusCommand(ORDER_ID, 'CONFIRMED'), { role: 'admin' });

    expect(result.status).toBe('CONFIRMED');
  });

  it('should reject customers with no vendor ownership', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    await expect(useCase.execute(TENANT_ID, new UpdateOrderStatusCommand(ORDER_ID, 'CONFIRMED'), { role: 'customer' }))
      .rejects.toThrow('only update orders assigned');
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should reject a vendor updating another shop order', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    await expect(useCase.execute(TENANT_ID, new UpdateOrderStatusCommand(ORDER_ID, 'CONFIRMED'), { role: 'vendor', vendorId: 'other-vendor' }))
      .rejects.toThrow('only update orders assigned');
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should reject requests without an actor', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(createOrder('PLACED'));

    await expect(useCase.execute(TENANT_ID, new UpdateOrderStatusCommand(ORDER_ID, 'CONFIRMED')))
      .rejects.toThrow('only update orders assigned');
  });

  it('should enforce tenant scoping', async () => {
    mockOrderRepo.findByIdAndTenant.mockResolvedValue(null);

    await expect(useCase.execute(TENANT_ID, new UpdateOrderStatusCommand(ORDER_ID, 'CONFIRMED'), { role: 'admin' }))
      .rejects.toThrow('Order not found');
    expect(mockOrderRepo.findByIdAndTenant).toHaveBeenCalledWith(expect.anything(), TENANT_ID);
  });
});
