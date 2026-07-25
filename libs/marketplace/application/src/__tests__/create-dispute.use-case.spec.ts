import { CreateDisputeUseCase } from '../lib/use-cases/dispute/create-dispute.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Order } from '@afri-market/marketplace-domain';

describe('CreateDisputeUseCase', () => {
  let useCase: CreateDisputeUseCase;
  let mockDisputeRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByOrderId: jest.Mock;
    findByCustomerId: jest.Mock;
    findOpenByVendor: jest.Mock;
    findEscalated: jest.Mock;
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

  const TENANT_ID = 'test-tenant';
  const ORDER_ID = 'order-1';
  const CUSTOMER_ID = 'customer-1';
  const VENDOR_ID = 'vendor-1';

  const createDeliveredOrder = () =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: undefined,
      type: 'food',
      status: 'DELIVERED',
      subtotal: Money.create(15000),
      deliveryFee: Money.create(2000),
      systemCommission: Money.create(1500),
      totalAmount: Money.create(15000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      version: 1,
    });

  const createPlacedOrder = () =>
    Order.reconstitute({
      id: EntityId.from(ORDER_ID),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      vendorId: EntityId.from(VENDOR_ID),
      driverId: undefined,
      type: 'food',
      status: 'PLACED',
      subtotal: Money.create(15000),
      deliveryFee: Money.create(2000),
      systemCommission: Money.create(1500),
      totalAmount: Money.create(15000),
      deliveryAddress: '123 Main St',
      deliveryLatitude: undefined,
      deliveryLongitude: undefined,
      specialInstructions: undefined,
      OTPCode: undefined,
      OTPVerified: false,
      version: 1,
    });

  const disputeParams = {
    orderId: ORDER_ID,
    customerId: CUSTOMER_ID,
    vendorId: VENDOR_ID,
    reason: 'FOOD_COLD' as const,
    description: 'The food arrived cold and inedible',
    claimAmount: 15000,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDisputeRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByOrderId: jest.fn(),
      findByCustomerId: jest.fn(),
      findOpenByVendor: jest.fn(),
      findEscalated: jest.fn(),
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

    useCase = new CreateDisputeUseCase(mockDisputeRepo, mockOrderRepo);
  });

  it('should create a dispute for a delivered order', async () => {
    const deliveredOrder = createDeliveredOrder();
    mockOrderRepo.findById.mockResolvedValue(deliveredOrder);

    const result = await useCase.execute(TENANT_ID, disputeParams);

    expect(result.disputeId).toBeDefined();
    expect(typeof result.disputeId).toBe('string');
    expect(result.disputeId.length).toBeGreaterThan(0);
    expect(mockDisputeRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create dispute with photo when disputePhotoUrl provided', async () => {
    const deliveredOrder = createDeliveredOrder();
    mockOrderRepo.findById.mockResolvedValue(deliveredOrder);

    const result = await useCase.execute(TENANT_ID, {
      ...disputeParams,
      disputePhotoUrl: 'https://example.com/photo.jpg',
    });

    expect(result.disputeId).toBeDefined();
    expect(mockDisputeRepo.save).toHaveBeenCalledTimes(1);

    const savedDispute = mockDisputeRepo.save.mock.calls[0][0];
    expect(savedDispute.description).toBe('The food arrived cold and inedible');
    expect(savedDispute.claimAmount.amount).toBe(15000);
  });

  it('should throw if order not found', async () => {
    mockOrderRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, disputeParams),
    ).rejects.toThrow('Order not found');
    expect(mockDisputeRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if order is not DELIVERED', async () => {
    const placedOrder = createPlacedOrder();
    mockOrderRepo.findById.mockResolvedValue(placedOrder);

    await expect(
      useCase.execute(TENANT_ID, disputeParams),
    ).rejects.toThrow('Disputes can only be opened for delivered orders');
    expect(mockDisputeRepo.save).not.toHaveBeenCalled();
  });

  it('should save dispute with correct properties', async () => {
    const deliveredOrder = createDeliveredOrder();
    mockOrderRepo.findById.mockResolvedValue(deliveredOrder);

    await useCase.execute(TENANT_ID, disputeParams);

    const savedDispute = mockDisputeRepo.save.mock.calls[0][0];
    expect(savedDispute.reason).toBe('FOOD_COLD');
    expect(savedDispute.description).toBe('The food arrived cold and inedible');
    expect(savedDispute.claimAmount.amount).toBe(15000);
    expect(savedDispute.status).toBe('OPEN');
  });
});
