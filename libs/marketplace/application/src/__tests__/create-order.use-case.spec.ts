import { CreateOrderUseCase } from '../lib/use-cases/order/create-order.use-case';
import { CreateOrderCommand } from '../lib/commands/create-order.command';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Vendor } from '@afri-market/marketplace-domain';
import { CommissionEngine } from '@afri-market/integrations';

jest.mock('@afri-market/integrations', () => ({
  CommissionEngine: {
    calculate: jest.fn(),
  },
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
  let mockSmsService: {
    send: jest.Mock;
    sendOtp: jest.Mock;
    sendDeliveryOtp: jest.Mock;
  };

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

    mockSmsService = {
      send: jest.fn().mockResolvedValue({ success: true }),
      sendOtp: jest.fn().mockResolvedValue({ success: true }),
      sendDeliveryOtp: jest.fn().mockResolvedValue({ success: true }),
    };

    useCase = new CreateOrderUseCase(mockOrderRepo, mockVendorRepo, mockPaymentRepo, undefined, mockSmsService);
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
    expect(result.otpCode).toMatch(/^\d{4}$/);
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

  it('should send the delivery OTP via SMS when a customer phone is provided', async () => {
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

    expect(mockSmsService.sendDeliveryOtp).toHaveBeenCalledTimes(1);
    expect(mockSmsService.sendDeliveryOtp).toHaveBeenCalledWith(
      '+255754100003',
      result.otpCode,
      result.orderId,
    );
  });
});
