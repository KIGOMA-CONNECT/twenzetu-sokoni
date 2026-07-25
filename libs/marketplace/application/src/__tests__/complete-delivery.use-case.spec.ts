import { CompleteDeliveryUseCase } from '../lib/use-cases/delivery/complete-delivery.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Delivery, Order, CustomerPoints } from '@afri-market/marketplace-domain';

describe('CompleteDeliveryUseCase', () => {
  let useCase: CompleteDeliveryUseCase;
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
  let mockPointsRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByCustomerId: jest.Mock;
    findByReferralCode: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  const TENANT_ID = 'test-tenant';
  const DELIVERY_ID = 'delivery-1';
  const ORDER_ID = 'order-1';
  const CUSTOMER_ID = 'customer-1';
  const VENDOR_ID = 'vendor-1';
  const DRIVER_ID = 'driver-1';

  const createTestDelivery = () =>
    Delivery.reconstitute({
      id: EntityId.from(DELIVERY_ID),
      tenantId: TenantId.create(TENANT_ID),
      orderId: EntityId.from(ORDER_ID),
      driverId: EntityId.from(DRIVER_ID),
      vehicleType: 'boda',
      status: 'IN_TRANSIT',
      pickupAddress: 'Shop Location',
      deliveryAddress: '123 Main St',
      pickupLatitude: -6.7924,
      pickupLongitude: 39.2083,
      deliveryLatitude: -6.8229,
      deliveryLongitude: 39.2703,
      distanceKm: 5.2,
      estimatedTimeMinutes: 20,
      driverEarnings: Money.create(0),
      version: 1,
    });

  const createTestOrder = (totalAmount: number = 500000) =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: EntityId.from(DRIVER_ID),
      type: 'food',
      status: 'OUT_FOR_DELIVERY',
      subtotal: Money.create(totalAmount),
      deliveryFee: Money.create(2000),
      systemCommission: Money.create(50000),
      totalAmount: Money.create(totalAmount),
      deliveryAddress: '123 Main St',
      deliveryLatitude: -6.8229,
      deliveryLongitude: 39.2703,
      specialInstructions: 'Ring the bell',
      OTPCode: undefined,
      OTPVerified: false,
      version: 1,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeliveryRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByOrderId: jest.fn(),
      findByDriverId: jest.fn(),
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

    mockPointsRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByCustomerId: jest.fn(),
      findByReferralCode: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    useCase = new CompleteDeliveryUseCase(
      mockDeliveryRepo,
      mockOrderRepo,
      mockPointsRepo,
    );
  });

  it('should mark delivery as DELIVERED', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder();

    mockDeliveryRepo.findById.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    });

    expect(delivery.status).toBe('DELIVERED');
    expect(delivery.driverEarnings.amount).toBe(2500);
    expect(mockDeliveryRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should mark order as DELIVERED', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder();

    mockDeliveryRepo.findById.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    });

    expect(order.status).toBe('DELIVERED');
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should accrue loyalty points for new customer', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000);

    mockDeliveryRepo.findById.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    });

    expect(result.loyaltyPointsEarned).toBe(5000);
    expect(result.status).toBe('DELIVERED');
    expect(result.driverEarnings).toBe(2500);
    expect(mockPointsRepo.save).toHaveBeenCalledTimes(1);

    const savedPoints = mockPointsRepo.save.mock.calls[0][0] as CustomerPoints;
    expect(savedPoints).toBeDefined();
    expect(savedPoints.totalPoints).toBeGreaterThan(0);
    expect(savedPoints.customerId.value).toBe(CUSTOMER_ID);
  });

  it('should accrue loyalty points for existing customer profile', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000);

    const existingPoints = CustomerPoints.reconstitute({
      id: EntityId.from('points-1'),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      totalPoints: 100,
      redeemablePoints: 80,
      lifetimePoints: 200,
      tier: 'SILVER',
      referralCode: undefined,
      referredBy: undefined,
      totalReferrals: 0,
      freeDeliveriesRemaining: 0,
      version: 1,
    });

    mockDeliveryRepo.findById.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(existingPoints);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    });

    expect(result.loyaltyPointsEarned).toBe(5000);
    expect(mockPointsRepo.save).toHaveBeenCalledTimes(1);

    const savedPoints = mockPointsRepo.save.mock.calls[0][0] as CustomerPoints;
    expect(savedPoints.totalPoints).toBeGreaterThan(100);
  });

  it('should throw if delivery not found', async () => {
    mockDeliveryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, {
        deliveryId: DELIVERY_ID,
        driverEarnings: 2500,
      }),
    ).rejects.toThrow('Delivery not found');
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if order not found', async () => {
    const delivery = createTestDelivery();

    mockDeliveryRepo.findById.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, {
        deliveryId: DELIVERY_ID,
        driverEarnings: 2500,
      }),
    ).rejects.toThrow('Order not found');
    expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
  });

  it('should return correct result shape', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(100000);

    mockDeliveryRepo.findById.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 3000,
    });

    expect(result).toEqual({
      deliveryId: DELIVERY_ID,
      orderId: ORDER_ID,
      status: 'DELIVERED',
      driverEarnings: 3000,
      loyaltyPointsEarned: 1000,
    });
  });
});
