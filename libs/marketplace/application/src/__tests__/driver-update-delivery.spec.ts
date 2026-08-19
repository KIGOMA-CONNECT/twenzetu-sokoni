import { DriverUpdateDeliveryStatusUseCase } from '../lib/use-cases/delivery/driver-update-delivery-status.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Delivery, DeliveryStatus, Order } from '@afri-market/marketplace-domain';

describe('DriverUpdateDeliveryStatusUseCase', () => {
  let useCase: DriverUpdateDeliveryStatusUseCase;
  let mockDeliveryRepo: Record<string, jest.Mock>;
  let mockOrderRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const DELIVERY_ID = 'delivery-123';
  const DRIVER_ID = 'driver-456';
  const ORDER_ID = 'order-789';

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeliveryRepo = { findByIdAndTenant: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockOrderRepo = {
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DriverUpdateDeliveryStatusUseCase(mockDeliveryRepo, mockOrderRepo);
  });

  const createDelivery = (status: string) =>
    Delivery.reconstitute({
      id: EntityId.from(DELIVERY_ID),
      tenantId: TenantId.create(TENANT_ID),
      orderId: EntityId.from(ORDER_ID),
      driverId: EntityId.from(DRIVER_ID),
      vehicleType: 'boda',
      status: status as DeliveryStatus,
      pickupAddress: 'Market',
      deliveryAddress: 'Home',
      pickupLatitude: undefined,
      pickupLongitude: undefined,
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      distanceKm: undefined,
      estimatedTimeMinutes: undefined,
      driverEarnings: Money.create(0),
      version: 1,
    });

  const createOrder = (pickupCode?: string) =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from('customer-123'),
      vendorId: EntityId.from('vendor-123'),
      driverId: EntityId.from(DRIVER_ID),
      type: 'food',
      status: 'PLACED',
      subtotal: Money.create(10000),
      deliveryFee: Money.create(2000),
      systemCommission: Money.create(1000),
      totalAmount: Money.create(12000),
      deliveryAddress: 'Home',
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      OTPAttempts: 0,
      PickupCode: pickupCode,
      version: 1,
    });

  it('should transition ASSIGNED to PICKED_UP', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('ASSIGNED'));

    const result = await useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'PICKED_UP');

    expect(result.status).toBe('PICKED_UP');
    expect(mockDeliveryRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should transition PICKED_UP to IN_TRANSIT', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('PICKED_UP'));

    const result = await useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'IN_TRANSIT');

    expect(result.status).toBe('IN_TRANSIT');
  });

  it('should transition IN_TRANSIT to DELIVERED preserving stored earnings', async () => {
    const delivery = Delivery.reconstitute({
      id: EntityId.from(DELIVERY_ID),
      tenantId: TenantId.create(TENANT_ID),
      orderId: EntityId.from('order-789'),
      driverId: EntityId.from(DRIVER_ID),
      vehicleType: 'boda',
      status: 'IN_TRANSIT',
      pickupAddress: 'Market',
      deliveryAddress: 'Home',
      driverEarnings: Money.create(2000),
      version: 1,
    });
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(delivery);

    const result = await useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'DELIVERED');

    expect(result.status).toBe('DELIVERED');
    expect(delivery.driverEarnings.amount).toBe(2000);
  });

  it('should throw on invalid transition', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('PENDING'));

    await expect(useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'DELIVERED')).rejects.toThrow('Cannot transition');
  });

  it('should throw if delivery not found', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(null);

    await expect(useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'PICKED_UP')).rejects.toThrow('not found');
  });

  it('should throw if not own delivery', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('ASSIGNED'));

    await expect(useCase.execute(TENANT_ID, DELIVERY_ID, 'other-driver', 'PICKED_UP')).rejects.toThrow('only update deliveries assigned');
  });

  it('should generate a pickup code on the order when accepting (ASSIGNED)', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('PENDING'));
    const order = createOrder();
    mockOrderRepo.findById.mockResolvedValue(order);

    const result = await useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'ASSIGNED');

    expect(result.status).toBe('ASSIGNED');
    expect(order.pickupCode).toMatch(/^\d{4}$/);
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });

  it('should throw on PICKED_UP when pickup code is missing', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('ASSIGNED'));
    const order = createOrder('1234');
    mockOrderRepo.findById.mockResolvedValue(order);

    await expect(useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'PICKED_UP')).rejects.toThrow('Invalid pickup code');
  });

  it('should throw on PICKED_UP when pickup code does not match', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('ASSIGNED'));
    const order = createOrder('1234');
    mockOrderRepo.findById.mockResolvedValue(order);

    await expect(useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'PICKED_UP', '9999')).rejects.toThrow('Invalid pickup code');
  });

  it('should transition PICKED_UP when pickup code matches', async () => {
    mockDeliveryRepo.findByIdAndTenant.mockResolvedValue(createDelivery('ASSIGNED'));
    const order = createOrder('1234');
    mockOrderRepo.findById.mockResolvedValue(order);

    const result = await useCase.execute(TENANT_ID, DELIVERY_ID, DRIVER_ID, 'PICKED_UP', '1234');

    expect(result.status).toBe('PICKED_UP');
    expect(order.status).toBe('OUT_FOR_DELIVERY');
    expect(mockOrderRepo.save).toHaveBeenCalledWith(order);
  });
});
