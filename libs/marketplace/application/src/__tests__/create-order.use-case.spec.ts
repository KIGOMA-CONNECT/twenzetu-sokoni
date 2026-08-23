import { CreateOrderUseCase } from '../lib/use-cases/order/create-order.use-case';
import { CreateOrderCommand } from '../lib/commands/create-order.command';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Vendor, Product } from '@afri-market/marketplace-domain';
import { CommissionEngine } from '@afri-market/integrations';

jest.mock('@afri-market/integrations', () => ({
  CommissionEngine: {
    calculate: jest.fn(),
  },
  getCurrencyForPhone: jest.fn(() => 'TZS'),
}));

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockVendorRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByUserId: jest.Mock;
    findActiveByTenant: jest.Mock;
    findByCategory: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };
  let mockOrderRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByCustomerId: jest.Mock;
    findByVendorId: jest.Mock;
    findByDriverId: jest.Mock;
    findPendingByVendor: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };
  let mockPaymentRepo: {
    save: jest.Mock;
    findByOrderId: jest.Mock;
  };
  let mockProductRepo: {
    findById: jest.Mock;
    findByIds: jest.Mock;
    save: jest.Mock;
  };
  let mockSmsService: {
    send: jest.Mock;
    sendOtp: jest.Mock;
    sendDeliveryOtp: jest.Mock;
  };
  let mockEventDispatcher: {
    dispatchOrderCreated: jest.Mock;
    dispatchPaymentConfirmed: jest.Mock;
    dispatchOrderStatusChanged: jest.Mock;
    dispatchDeliveryCompleted: jest.Mock;
  };
  let mockDs: { query: jest.Mock; transaction: jest.Mock };

  const TENANT_ID = 'test-tenant';
  const VENDOR_ID = 'vendor-123';
  const CUSTOMER_ID = 'customer-456';

  beforeEach(() => {
    jest.clearAllMocks();

    mockVendorRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByTenant: jest.fn(),
      findByCategory: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockOrderRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByCustomerId: jest.fn(),
      findByVendorId: jest.fn(),
      findByDriverId: jest.fn(),
      findPendingByVendor: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockPaymentRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByOrderId: jest.fn().mockResolvedValue(null),
    };

    mockProductRepo = {
      findById: jest.fn().mockImplementation((id: { value: string } | string) => {
        const key = typeof id === 'object' && id !== null ? id.value : String(id);
        if (key === 'p1') {
          return Promise.resolve(createProduct('p1', 'Pizza', 500));
        }
        if (key === 'p2') {
          return Promise.resolve(createProduct('p2', 'Soda', 200));
        }
        return Promise.resolve(null);
      }),
      findByIds: jest.fn().mockImplementation((ids: string[]) =>
        Promise.resolve(
          ids
            .map((key) => {
              if (key === 'p1') return createProduct('p1', 'Pizza', 500);
              if (key === 'p2') return createProduct('p2', 'Soda', 200);
              return null;
            })
            .filter((p) => p !== null),
        ),
      ),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockSmsService = {
      send: jest.fn().mockResolvedValue({ success: true }),
      sendOtp: jest.fn().mockResolvedValue({ success: true }),
      sendDeliveryOtp: jest.fn().mockResolvedValue({ success: true }),
    };

    mockEventDispatcher = {
      dispatchOrderCreated: jest.fn(),
      dispatchPaymentConfirmed: jest.fn(),
      dispatchOrderStatusChanged: jest.fn(),
      dispatchDeliveryCompleted: jest.fn(),
    };

    mockDs = {
      query: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(async (cb: (em: unknown) => Promise<void>) => {
        await cb({ query: jest.fn().mockResolvedValue([{ id: 'claimed' }]) });
      }),
    };

    useCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockVendorRepo,
      mockPaymentRepo,
      mockProductRepo,
      mockDs as never,
      { execute: jest.fn().mockResolvedValue({ balance: Money.create(0), currency: 'TZS' }) } as never,
      { execute: jest.fn().mockResolvedValue({ success: true }) } as never,
      { findByUserId: jest.fn().mockResolvedValue(null) } as never,
      undefined,
      mockSmsService,
      undefined,
      undefined,
      mockEventDispatcher,
    );
  });

  const createProduct = (id: string, name: string, price: number) =>
    Product.reconstitute({
      id: EntityId.from(id),
      tenantId: TenantId.create(TENANT_ID),
      vendorId: EntityId.from(VENDOR_ID),
      name,
      description: '',
      price: Money.create(price),
      type: 'regular',
      categoryId: undefined,
      imageUrl: undefined,
      stockQuantity: 100,
      unit: 'piece',
      status: 'ACTIVE',
      version: 1,
    });

  const createActiveVendor = () =>
    Vendor.reconstitute({
      id: EntityId.from(VENDOR_ID),
      tenantId: TenantId.create(TENANT_ID),
      userId: EntityId.from('user-1'),
      shopName: 'Test Shop',
      description: 'A test shop',
      category: 'food',
      commissionRate: 10,
      status: 'ACTIVE',
      averageRating: 4.5,
      totalOrders: 100,
      version: 1,
    });

  const createCommand = () =>
    new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [
        { productId: 'p1', productName: 'Pizza', quantity: 2, unitPrice: 500 },
        { productId: 'p2', productName: 'Soda', quantity: 3, unitPrice: 200 },
      ],
      'cash',
    );

  it('should create an order with correct totals using CommissionEngine', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);

    (CommissionEngine.calculate as jest.Mock).mockReturnValue({
      itemsSubtotal: Money.create(1600),
      systemCommission: Money.create(160),
      vendorNet: Money.create(1440),
      deliveryFee: Money.create(0),
      driverNet: Money.create(0),
      totalPaid: Money.create(1600),
    });

    const command = createCommand();
    const result = await useCase.execute(TENANT_ID, command);

    expect(result.orderId).toBeDefined();
    expect(result.total).toBe(1600);
    expect(result.commission).toBe(160);
    expect(result.vendorNet).toBe(1440);
    expect(result.deliveryFee).toBe(0);
    expect(result.paymentId).toBeDefined();
    expect(result.paymentStatus).toBe('ESCROW_HELD');
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
    expect(mockPaymentRepo.save).toHaveBeenCalledTimes(2);

    const savedOrder = mockOrderRepo.save.mock.calls[0][0];
    expect(savedOrder.otpCode).toMatch(/^\d{4}$/);

    expect(CommissionEngine.calculate).toHaveBeenCalledWith({
      items: [
        { unitPrice: 500, quantity: 2 },
        { unitPrice: 200, quantity: 3 },
      ],
      vendorCommissionRate: 10,
      deliveryFee: 0,
      currency: 'TZS',
    });
  });

  it('should throw if vendor not found', async () => {
    mockVendorRepo.findById.mockResolvedValue(null);

    const command = createCommand();

    await expect(useCase.execute(TENANT_ID, command)).rejects.toThrow(
      'Vendor not found',
    );
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if vendor is not ACTIVE', async () => {
    const pendingVendor = Vendor.reconstitute({
      id: EntityId.from(VENDOR_ID),
      tenantId: TenantId.create(TENANT_ID),
      userId: EntityId.from('user-1'),
      shopName: 'Pending Shop',
      description: 'Not active yet',
      category: 'food',
      commissionRate: 10,
      status: 'PENDING',
      averageRating: 0,
      totalOrders: 0,
      version: 1,
    });
    mockVendorRepo.findById.mockResolvedValue(pendingVendor);

    const command = createCommand();

    await expect(useCase.execute(TENANT_ID, command)).rejects.toThrow(
      'Vendor is not active',
    );
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if order has no items', async () => {
    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [],
    );

    await expect(useCase.execute(TENANT_ID, command)).rejects.toThrow(
      'Order must have at least one item',
    );
    expect(mockVendorRepo.findById).not.toHaveBeenCalled();
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should call orderRepo.save with the order', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);

    (CommissionEngine.calculate as jest.Mock).mockReturnValue({
      itemsSubtotal: Money.create(1000),
      systemCommission: Money.create(100),
      vendorNet: Money.create(900),
      deliveryFee: Money.create(0),
      driverNet: Money.create(0),
      totalPaid: Money.create(1000),
    });

    const command = createCommand();
    await useCase.execute(TENANT_ID, command);

    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
    const savedOrder = mockOrderRepo.save.mock.calls[0][0];
    expect(savedOrder).toBeDefined();
    expect(savedOrder.id).toBeDefined();
    expect(savedOrder.status).toBe('PLACED');
    expect(savedOrder.customerId.value).toBe(CUSTOMER_ID);
    expect(savedOrder.vendorId.value).toBe(VENDOR_ID);
  });

  it('should dispatch order-created event with OTP when a customer phone is provided', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);

    (CommissionEngine.calculate as jest.Mock).mockReturnValue({
      itemsSubtotal: Money.create(1600),
      systemCommission: Money.create(160),
      vendorNet: Money.create(1440),
      deliveryFee: Money.create(0),
      driverNet: Money.create(0),
      totalPaid: Money.create(1600),
    });

    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [{ productId: 'p1', productName: 'Pizza', quantity: 1, unitPrice: 500 }],
      'cash',
      undefined,
      undefined,
      undefined,
      '+255754100003',
    );

    const result = await useCase.execute(TENANT_ID, command);

    expect(mockEventDispatcher.dispatchOrderCreated).toHaveBeenCalledTimes(1);
    const dispatchedEvent = (mockEventDispatcher.dispatchOrderCreated as jest.Mock).mock.calls[0][0];
    expect(dispatchedEvent.customerPhone).toBe('+255754100003');
    expect(dispatchedEvent.otpCode).toMatch(/^\d{4}$/);
    expect(dispatchedEvent.orderId).toBe(result.orderId);
  });

  it('should use server-side product price instead of client-supplied price', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);

    (CommissionEngine.calculate as jest.Mock).mockReturnValue({
      itemsSubtotal: Money.create(1000),
      systemCommission: Money.create(100),
      vendorNet: Money.create(900),
      deliveryFee: Money.create(0),
      driverNet: Money.create(0),
      totalPaid: Money.create(1000),
    });

    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [{ productId: 'p1', productName: 'Pizza', quantity: 2, unitPrice: 1 }],
      'cash',
    );

    await useCase.execute(TENANT_ID, command);

    expect(CommissionEngine.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ unitPrice: 500, quantity: 2 }],
      }),
    );
  });

  it('should throw if a product is not available', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);
    mockProductRepo.findByIds.mockResolvedValue([]);

    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [{ productId: 'missing', productName: 'Ghost', quantity: 1, unitPrice: 100 }],
      'cash',
    );

    await expect(useCase.execute(TENANT_ID, command)).rejects.toThrow(
      'no longer available',
    );
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if product does not belong to the vendor', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);
    mockProductRepo.findByIds.mockResolvedValue([
      Product.reconstitute({
        id: EntityId.from('p-other'),
        tenantId: TenantId.create(TENANT_ID),
        vendorId: EntityId.from('other-vendor'),
        name: 'Foreign',
        description: '',
        price: Money.create(100),
        type: 'regular',
        categoryId: undefined,
        imageUrl: undefined,
        stockQuantity: 10,
        unit: 'piece',
        status: 'ACTIVE',
        version: 1,
      }),
    ]);

    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [{ productId: 'p-other', productName: 'Foreign', quantity: 1, unitPrice: 100 }],
      'cash',
    );

    await expect(useCase.execute(TENANT_ID, command)).rejects.toThrow(
      'does not belong to this vendor',
    );
  });

  it('should throw if stock is insufficient', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);
    mockProductRepo.findByIds.mockResolvedValue([
      Product.reconstitute({
        id: EntityId.from('p1'),
        tenantId: TenantId.create(TENANT_ID),
        vendorId: EntityId.from(VENDOR_ID),
        name: 'Pizza',
        description: '',
        price: Money.create(500),
        type: 'regular',
        categoryId: undefined,
        imageUrl: undefined,
        stockQuantity: 1,
        unit: 'piece',
        status: 'ACTIVE',
        version: 1,
      }),
    ]);

    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [{ productId: 'p1', productName: 'Pizza', quantity: 5, unitPrice: 500 }],
      'cash',
    );

    await expect(useCase.execute(TENANT_ID, command)).rejects.toThrow(
      'Insufficient stock',
    );
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should reduce stock after creating the order', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);

    (CommissionEngine.calculate as jest.Mock).mockReturnValue({
      itemsSubtotal: Money.create(1000),
      systemCommission: Money.create(100),
      vendorNet: Money.create(900),
      deliveryFee: Money.create(0),
      driverNet: Money.create(0),
      totalPaid: Money.create(1000),
    });

    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'food',
      '123 Main St',
      [{ productId: 'p1', productName: 'Pizza', quantity: 2, unitPrice: 500 }],
      'cash',
    );

    await useCase.execute(TENANT_ID, command);

    // Stock is claimed atomically via a transactional guarded UPDATE —
    // no read-modify-write through the product repository anymore.
    expect(mockProductRepo.save).not.toHaveBeenCalled();
    expect(mockDs.transaction).toHaveBeenCalledTimes(1);
  });

  it('should create a service order without requiring a real product row', async () => {
    const vendor = createActiveVendor();
    mockVendorRepo.findById.mockResolvedValue(vendor);

    (CommissionEngine.calculate as jest.Mock).mockReturnValue({
      itemsSubtotal: Money.create(25000),
      systemCommission: Money.create(2500),
      vendorNet: Money.create(22500),
      deliveryFee: Money.create(0),
      driverNet: Money.create(0),
      totalPaid: Money.create(25000),
    });

    const serviceRequestId = 'service-request-uuid';
    const command = new CreateOrderCommand(
      CUSTOMER_ID,
      VENDOR_ID,
      'service',
      'Service delivery',
      [
        { productId: serviceRequestId, productName: 'Plumbing repair', quantity: 1, unitPrice: 25000 },
      ],
      'cash',
    );

    const result = await useCase.execute(TENANT_ID, command);

    expect(result.orderId).toBeDefined();
    expect(result.total).toBe(25000);
    // product lookup must NOT be attempted for service orders
    expect(mockProductRepo.findByIds).not.toHaveBeenCalled();
    expect(mockProductRepo.save).not.toHaveBeenCalled();
    expect(mockDs.transaction).not.toHaveBeenCalled();
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });
});
