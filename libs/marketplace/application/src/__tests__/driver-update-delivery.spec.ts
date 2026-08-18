import { DriverUpdateDeliveryStatusUseCase } from '../lib/use-cases/delivery/driver-update-delivery-status.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Delivery, DeliveryStatus } from '@afri-market/marketplace-domain';

describe('DriverUpdateDeliveryStatusUseCase', () => {
  let useCase: DriverUpdateDeliveryStatusUseCase;
  let mockDeliveryRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const DELIVERY_ID = 'delivery-123';
  const DRIVER_ID = 'driver-456';

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeliveryRepo = { findByIdAndTenant: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new DriverUpdateDeliveryStatusUseCase(mockDeliveryRepo);
  });

  const createDelivery = (status: string) =>
    Delivery.reconstitute({
      id: EntityId.from(DELIVERY_ID),
      tenantId: TenantId.create(TENANT_ID),
      orderId: EntityId.from('order-789'),
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
});
