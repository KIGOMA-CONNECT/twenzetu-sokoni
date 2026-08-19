import { CreateDeliveryUseCase } from '../lib/use-cases/delivery/create-delivery.use-case';
import { CreateDeliveryCommand } from '../lib/commands/create-delivery.command';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Order } from '@afri-market/marketplace-domain';

describe('CreateDeliveryUseCase', () => {
  let useCase: CreateDeliveryUseCase;
  let mockDeliveryRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByOrderId: jest.Mock;
    findByDriverId: jest.Mock;
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
  let mockRouteEstimator: {
    estimateAndPersist: jest.Mock;
  };

  const TENANT_ID = 'test-tenant';
  const ORDER_ID = 'order-1';
  const VENDOR_ID = 'vendor-1';
  const DRIVER_ID = 'driver-1';

  const createOrder = () =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from('customer-1'),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: undefined,
      type: 'food',
      status: 'READY_FOR_PICKUP',
      subtotal: Money.create(1000),
      deliveryFee: Money.create(0),
      systemCommission: Money.create(100),
      totalAmount: Money.create(1000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      specialInstructions: undefined,
      OTPCode: '1234',
      OTPVerified: false,
      OTPAttempts: 0,
      version: 1,
    });

  const command = () =>
    new CreateDeliveryCommand(
      ORDER_ID,
      DRIVER_ID,
      'boda',
      'Pickup',
      'Dropoff',
      -6.8,
      39.2,
      -6.9,
      39.3,
    );

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeliveryRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findByOrderId: jest.fn().mockResolvedValue(null),
      findByDriverId: jest.fn().mockResolvedValue([]),
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

    mockRouteEstimator = {
      estimateAndPersist: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new CreateDeliveryUseCase(mockDeliveryRepo, mockOrderRepo, mockRouteEstimator);
  });

  it('should estimate the route when coordinates are provided', async () => {
    mockOrderRepo.findById.mockResolvedValue(createOrder());
    const result = await useCase.execute(TENANT_ID, command(), {
      userId: 'user-1',
      role: 'vendor',
      vendorId: VENDOR_ID,
    });
    expect(result.deliveryId).toBeDefined();
    expect(mockDeliveryRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRouteEstimator.estimateAndPersist).toHaveBeenCalledTimes(1);
    expect(mockRouteEstimator.estimateAndPersist).toHaveBeenCalledWith(
      result.deliveryId,
      { latitude: -6.8, longitude: 39.2 },
      { latitude: -6.9, longitude: 39.3 },
    );
  });

  it('should create a delivery when actor is the order vendor', async () => {
    mockOrderRepo.findById.mockResolvedValue(createOrder());
    const result = await useCase.execute(TENANT_ID, command(), {
      userId: 'user-1',
      role: 'vendor',
      vendorId: VENDOR_ID,
    });
    expect(result.deliveryId).toBeDefined();
    expect(mockDeliveryRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create a delivery when actor is an admin', async () => {
    mockOrderRepo.findById.mockResolvedValue(createOrder());
    const result = await useCase.execute(TENANT_ID, command(), {
      userId: 'admin-1',
      role: 'admin',
    });
    expect(result.deliveryId).toBeDefined();
  });

  it('should reject delivery creation when actor is neither vendor nor admin', async () => {
    mockOrderRepo.findById.mockResolvedValue(createOrder());
    await expect(
      useCase.execute(TENANT_ID, command(), {
        userId: 'customer-1',
        role: 'customer',
      }),
    ).rejects.toThrow('Only the order vendor or an admin can create a delivery assignment');
    expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
  });
});
