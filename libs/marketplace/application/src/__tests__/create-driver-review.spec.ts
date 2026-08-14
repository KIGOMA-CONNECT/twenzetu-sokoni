import { CreateDriverReviewUseCase } from '../lib/use-cases/review/create-driver-review.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Delivery, Order } from '@afri-market/marketplace-domain';

describe('CreateDriverReviewUseCase', () => {
  let useCase: CreateDriverReviewUseCase;
  let mockReviewRepo: Record<string, jest.Mock>;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockDeliveryRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const ORDER_ID = 'order-1';
  const DELIVERY_ID = 'delivery-1';
  const CUSTOMER_ID = 'customer-1';
  const VENDOR_ID = 'vendor-1';
  const DRIVER_ID = 'driver-1';

  const createTestOrder = () =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: EntityId.from(DRIVER_ID),
      type: 'cargo',
      status: 'DELIVERED',
      subtotal: Money.create(500000),
      deliveryFee: Money.create(2000),
      systemCommission: Money.create(50000),
      totalAmount: Money.create(552000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: -6.8229,
      deliveryLongitude: 39.2703,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      OTPAttempts: 0,
      version: 1,
    });

  const createTestDelivery = () =>
    Delivery.reconstitute({
      id: EntityId.from(DELIVERY_ID),
      tenantId: TenantId.create(TENANT_ID),
      orderId: EntityId.from(ORDER_ID),
      driverId: EntityId.from(DRIVER_ID),
      vehicleType: 'boda',
      status: 'DELIVERED',
      pickupAddress: 'Shop Location',
      deliveryAddress: '123 Main St',
      pickupLatitude: -6.7924,
      pickupLongitude: 39.2083,
      deliveryLatitude: -6.8229,
      deliveryLongitude: 39.2703,
      distanceKm: 5.2,
      estimatedTimeMinutes: 20,
      driverEarnings: Money.create(2000),
      version: 2,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReviewRepo = {
      findByDeliveryId: jest.fn().mockResolvedValue(null),
      statsForDriver: jest.fn().mockResolvedValue({ averageRating: 5, totalReviews: 1 }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockOrderRepo = {
      findById: jest.fn(),
    };
    mockDeliveryRepo = {
      findByOrderId: jest.fn(),
    };

    useCase = new CreateDriverReviewUseCase(
      mockReviewRepo,
      mockOrderRepo,
      mockDeliveryRepo,
    );
  });

  it('should create a driver review for a delivered order', async () => {
    mockOrderRepo.findById.mockResolvedValue(createTestOrder());
    mockDeliveryRepo.findByOrderId.mockResolvedValue(createTestDelivery());

    const result = await useCase.execute(TENANT_ID, CUSTOMER_ID, {
      orderId: ORDER_ID,
      rating: 5,
      comment: 'Great driver!',
    });

    expect(result.driverId).toBe(DRIVER_ID);
    expect(result.driverAverageRating).toBe(5);
    expect(result.totalReviews).toBe(1);
    expect(mockReviewRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject rating a non-delivered order', async () => {
    const pending = Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: EntityId.from(DRIVER_ID),
      type: 'cargo',
      status: 'PLACED',
      subtotal: Money.create(500000),
      deliveryFee: Money.create(2000),
      systemCommission: Money.create(50000),
      totalAmount: Money.create(552000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: -6.8229,
      deliveryLongitude: 39.2703,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      OTPAttempts: 0,
      version: 1,
    });
    mockOrderRepo.findById.mockResolvedValue(pending);
    mockDeliveryRepo.findByOrderId.mockResolvedValue(createTestDelivery());

    await expect(
      useCase.execute(TENANT_ID, CUSTOMER_ID, { orderId: ORDER_ID, rating: 5 }),
    ).rejects.toThrow('Can only review delivered orders');
    expect(mockReviewRepo.save).not.toHaveBeenCalled();
  });

  it('should reject rating someone else\'s order', async () => {
    mockOrderRepo.findById.mockResolvedValue(createTestOrder());

    await expect(
      useCase.execute(TENANT_ID, 'other-customer', { orderId: ORDER_ID, rating: 5 }),
    ).rejects.toThrow('You can only review your own orders');
  });

  it('should reject a duplicate review for the same delivery', async () => {
    mockOrderRepo.findById.mockResolvedValue(createTestOrder());
    mockDeliveryRepo.findByOrderId.mockResolvedValue(createTestDelivery());
    mockReviewRepo.findByDeliveryId.mockResolvedValue({ id: 'review-1' });

    await expect(
      useCase.execute(TENANT_ID, CUSTOMER_ID, { orderId: ORDER_ID, rating: 4 }),
    ).rejects.toThrow('Driver already reviewed for this delivery');
  });

  it('should reject when no delivery exists for the order', async () => {
    mockOrderRepo.findById.mockResolvedValue(createTestOrder());
    mockDeliveryRepo.findByOrderId.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, CUSTOMER_ID, { orderId: ORDER_ID, rating: 5 }),
    ).rejects.toThrow('No delivery found for this order');
  });
});
