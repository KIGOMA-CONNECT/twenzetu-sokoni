import { CompleteDeliveryUseCase } from '../lib/use-cases/delivery/complete-delivery.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Delivery, Order, CustomerPoints } from '@afri-market/marketplace-domain';

describe('CompleteDeliveryUseCase', () => {
  let useCase: CompleteDeliveryUseCase;
  let mockDeliveryRepo: {
    findById: jest.Mock;
    findByIdAndTenant: jest.Mock;
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
  let mockPaymentRepo: {
    findByOrderId: jest.Mock;
    save: jest.Mock;
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

  const createTestOrder = (totalAmount: number = 500000, otpCode?: string) =>
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
      OTPCode: otpCode,
      OTPVerified: false,
      version: 1,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeliveryRepo = {
      findById: jest.fn(),
      findByIdAndTenant: jest.fn(),
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

    mockPaymentRepo = {
      findByOrderId: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };

    useCase = new CompleteDeliveryUseCase(
      mockDeliveryRepo,
      mockOrderRepo,
      mockPointsRepo,
      mockPaymentRepo,
    );
  });

  it('should mark delivery as DELIVERED', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder();

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    }, { driverId: DRIVER_ID, role: 'driver' });

    expect(delivery.status).toBe('DELIVERED');
    expect(delivery.driverEarnings.amount).toBe(2500);
    expect(mockDeliveryRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should mark order as DELIVERED', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder();

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    }, { driverId: DRIVER_ID, role: 'driver' });

    expect(order.status).toBe('DELIVERED');
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should accrue loyalty points for new customer', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000);

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    }, { driverId: DRIVER_ID, role: 'driver' });

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

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(existingPoints);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    }, { driverId: DRIVER_ID, role: 'driver' });

    expect(result.loyaltyPointsEarned).toBe(5000);
    expect(mockPointsRepo.save).toHaveBeenCalledTimes(1);

    const savedPoints = mockPointsRepo.save.mock.calls[0][0] as CustomerPoints;
    expect(savedPoints.totalPoints).toBeGreaterThan(100);
  });

  it('should throw if delivery not found', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(null);

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

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, {
        deliveryId: DELIVERY_ID,
        driverEarnings: 2500,
      }, { driverId: DRIVER_ID, role: 'driver' }),
    ).rejects.toThrow('Order not found');
    expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
  });

  it('should return correct result shape', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(100000);

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 3000,
    }, { driverId: DRIVER_ID, role: 'driver' });

    expect(result).toEqual({
      deliveryId: DELIVERY_ID,
      orderId: ORDER_ID,
      status: 'DELIVERED',
      driverEarnings: 3000,
      loyaltyPointsEarned: 1000,
      paymentReleased: false,
      vendorAmountCredited: 0,
      driverAmountCredited: 0,
      otpVerified: false,
    });
  });

  it('should reject completion with wrong delivery OTP without releasing escrow', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000, '1234');

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPaymentRepo.findByOrderId.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, {
        deliveryId: DELIVERY_ID,
        driverEarnings: 2500,
        deliveryOtp: '9999',
      }, { driverId: DRIVER_ID, role: 'driver' }),
    ).rejects.toThrow('Invalid delivery confirmation code');

    expect(delivery.status).toBe('IN_TRANSIT');
    expect(order.status).toBe('OUT_FOR_DELIVERY');
    expect(order.otpVerified).toBe(false);
    expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
    expect(mockPaymentRepo.save).not.toHaveBeenCalled();
  });

  it('should reject completion when delivery OTP is required but missing', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000, '1234');

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, {
        deliveryId: DELIVERY_ID,
        driverEarnings: 2500,
      }, { driverId: DRIVER_ID, role: 'driver' }),
    ).rejects.toThrow('Invalid delivery confirmation code');
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should complete delivery and verify OTP when correct code is provided', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000, '1234');

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPaymentRepo.findByOrderId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
      deliveryOtp: '1234',
    }, { driverId: DRIVER_ID, role: 'driver' });

    expect(result.status).toBe('DELIVERED');
    expect(result.otpVerified).toBe(true);
    expect(order.otpVerified).toBe(true);
    expect(delivery.status).toBe('DELIVERED');
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should release escrow only after valid delivery OTP is provided', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000, '1234');

    const { Payment } = jest.requireActual('@afri-market/marketplace-domain');
    const payment = Payment.create({
      tenantId: TenantId.create(TENANT_ID),
      orderId: EntityId.from(ORDER_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      vendorId: EntityId.from(VENDOR_ID),
      amount: Money.create(500000),
      method: 'mpesa',
      systemCommission: Money.create(50000),
      vendorNet: Money.create(400000),
      driverNet: Money.create(2000),
    });
    payment.confirmEscrow();

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPaymentRepo.findByOrderId.mockResolvedValue(payment);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
      deliveryOtp: '1234',
    }, { driverId: DRIVER_ID, role: 'driver' });

    expect(result.otpVerified).toBe(true);
    expect(payment.status).toBe('RELEASED');
    expect(mockPaymentRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject completion by a different driver', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000, '1234');

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPaymentRepo.findByOrderId.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, {
        deliveryId: DELIVERY_ID,
        driverEarnings: 2500,
        deliveryOtp: '1234',
      }, { driverId: 'other-driver', role: 'driver' }),
    ).rejects.toThrow('You can only complete deliveries assigned to you');

    expect(delivery.status).toBe('IN_TRANSIT');
    expect(order.status).toBe('OUT_FOR_DELIVERY');
    expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
    expect(mockPaymentRepo.save).not.toHaveBeenCalled();
  });

  it('should reject completion without an actor', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000);

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, {
        deliveryId: DELIVERY_ID,
        driverEarnings: 2500,
      }),
    ).rejects.toThrow('You can only complete deliveries assigned to you');
    expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
  });

  it('should allow an admin to complete any delivery', async () => {
    const delivery = createTestDelivery();
    const order = createTestOrder(500000);

    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPaymentRepo.findByOrderId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, {
      deliveryId: DELIVERY_ID,
      driverEarnings: 2500,
    }, { driverId: 'ops-user', role: 'operations_admin' });

    expect(result.status).toBe('DELIVERED');
    expect(order.status).toBe('DELIVERED');
  });
});
