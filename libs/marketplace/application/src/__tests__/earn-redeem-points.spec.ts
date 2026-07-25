import { EarnPointsUseCase } from '../lib/use-cases/loyalty/earn-points.use-case';
import { RedeemPointsUseCase } from '../lib/use-cases/loyalty/redeem-points.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { CustomerPoints } from '@afri-market/marketplace-domain';

describe('EarnPointsUseCase', () => {
  let useCase: EarnPointsUseCase;
  let mockPointsRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByCustomerId: jest.Mock;
    findByReferralCode: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  const TENANT_ID = 'test-tenant';
  const CUSTOMER_ID = 'customer-1';
  const ORDER_ID = 'order-1';

  beforeEach(() => {
    jest.clearAllMocks();

    mockPointsRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByCustomerId: jest.fn(),
      findByReferralCode: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    useCase = new EarnPointsUseCase(mockPointsRepo);
  });

  it('should create new points profile and earn points', async () => {
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute(TENANT_ID, {
      customerId: CUSTOMER_ID,
      orderId: ORDER_ID,
      orderTotal: 500000,
    });

    expect(result.pointsEarned).toBe(5000);
    expect(result.newTotal).toBe(50);
    expect(result.tier).toBe('BRONZE');
    expect(mockPointsRepo.save).toHaveBeenCalledTimes(1);
    expect(mockPointsRepo.findByCustomerId).toHaveBeenCalledWith(CUSTOMER_ID);

    const savedPoints = mockPointsRepo.save.mock.calls[0][0] as CustomerPoints;
    expect(savedPoints).toBeDefined();
    expect(savedPoints.customerId.value).toBe(CUSTOMER_ID);
    expect(savedPoints.tenantId.value).toBe(TENANT_ID);
  });

  it('should add points to existing profile', async () => {
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
    mockPointsRepo.findByCustomerId.mockResolvedValue(existingPoints);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute(TENANT_ID, {
      customerId: CUSTOMER_ID,
      orderId: ORDER_ID,
      orderTotal: 500000,
    });

    expect(result.pointsEarned).toBe(5000);
    expect(result.newTotal).toBe(150);
    expect(result.tier).toBe('SILVER');
    expect(mockPointsRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should calculate points earned as floor(orderTotal / 100)', async () => {
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute(TENANT_ID, {
      customerId: CUSTOMER_ID,
      orderId: ORDER_ID,
      orderTotal: 35000,
    });

    expect(result.pointsEarned).toBe(350);
    expect(mockPointsRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should upgrade tier when lifetime points reach threshold', async () => {
    const nearGoldPoints = CustomerPoints.reconstitute({
      id: EntityId.from('points-1'),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      totalPoints: 400,
      redeemablePoints: 300,
      lifetimePoints: 490,
      tier: 'SILVER',
      referralCode: undefined,
      referredBy: undefined,
      totalReferrals: 0,
      freeDeliveriesRemaining: 0,
      version: 1,
    });
    mockPointsRepo.findByCustomerId.mockResolvedValue(nearGoldPoints);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute(TENANT_ID, {
      customerId: CUSTOMER_ID,
      orderId: ORDER_ID,
      orderTotal: 500000,
    });

    expect(result.tier).toBe('GOLD');
  });

  it('should return zero points for small order total', async () => {
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute(TENANT_ID, {
      customerId: CUSTOMER_ID,
      orderId: ORDER_ID,
      orderTotal: 50,
    });

    expect(result.pointsEarned).toBe(0);
    expect(result.newTotal).toBe(0);
    expect(result.tier).toBe('BRONZE');
  });
});

describe('RedeemPointsUseCase', () => {
  let useCase: RedeemPointsUseCase;
  let mockPointsRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByCustomerId: jest.Mock;
    findByReferralCode: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  const TENANT_ID = 'test-tenant';
  const CUSTOMER_ID = 'customer-1';

  beforeEach(() => {
    jest.clearAllMocks();

    mockPointsRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByCustomerId: jest.fn(),
      findByReferralCode: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    useCase = new RedeemPointsUseCase(mockPointsRepo);
  });

  it('should redeem points successfully', async () => {
    const points = CustomerPoints.reconstitute({
      id: EntityId.from('points-1'),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      totalPoints: 500,
      redeemablePoints: 300,
      lifetimePoints: 500,
      tier: 'SILVER',
      referralCode: undefined,
      referredBy: undefined,
      totalReferrals: 0,
      freeDeliveriesRemaining: 2,
      version: 1,
    });
    mockPointsRepo.findByCustomerId.mockResolvedValue(points);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      customerId: CUSTOMER_ID,
      pointsToRedeem: 200,
    });

    expect(result.redeemedPoints).toBe(200);
    expect(result.rewardType).toBe('FREE_DELIVERY');
    expect(result.freeDelivery).toBe(true);
    expect(result.discountPercentage).toBe(0);
    expect(result.remainingRedeemable).toBe(100);
    expect(mockPointsRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if insufficient points', async () => {
    const points = CustomerPoints.reconstitute({
      id: EntityId.from('points-1'),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      totalPoints: 100,
      redeemablePoints: 50,
      lifetimePoints: 100,
      tier: 'BRONZE',
      referralCode: undefined,
      referredBy: undefined,
      totalReferrals: 0,
      freeDeliveriesRemaining: 0,
      version: 1,
    });
    mockPointsRepo.findByCustomerId.mockResolvedValue(points);

    await expect(
      useCase.execute({
        customerId: CUSTOMER_ID,
        pointsToRedeem: 200,
      }),
    ).rejects.toThrow('Insufficient redeemable points');
    expect(mockPointsRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if customer profile not found', async () => {
    mockPointsRepo.findByCustomerId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        customerId: CUSTOMER_ID,
        pointsToRedeem: 100,
      }),
    ).rejects.toThrow('Customer loyalty profile not found');
    expect(mockPointsRepo.save).not.toHaveBeenCalled();
  });

  it('should return DISCOUNT reward type when no free deliveries remain', async () => {
    const points = CustomerPoints.reconstitute({
      id: EntityId.from('points-1'),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      totalPoints: 600,
      redeemablePoints: 400,
      lifetimePoints: 600,
      tier: 'GOLD',
      referralCode: undefined,
      referredBy: undefined,
      totalReferrals: 0,
      freeDeliveriesRemaining: 0,
      version: 1,
    });
    mockPointsRepo.findByCustomerId.mockResolvedValue(points);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      customerId: CUSTOMER_ID,
      pointsToRedeem: 100,
    });

    expect(result.rewardType).toBe('DISCOUNT');
    expect(result.freeDelivery).toBe(false);
    expect(result.discountPercentage).toBe(5);
  });

  it('should return correct discount for PLATINUM tier', async () => {
    const points = CustomerPoints.reconstitute({
      id: EntityId.from('points-1'),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from(CUSTOMER_ID),
      totalPoints: 1500,
      redeemablePoints: 1000,
      lifetimePoints: 1500,
      tier: 'PLATINUM',
      referralCode: undefined,
      referredBy: undefined,
      totalReferrals: 0,
      freeDeliveriesRemaining: 0,
      version: 1,
    });
    mockPointsRepo.findByCustomerId.mockResolvedValue(points);
    mockPointsRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      customerId: CUSTOMER_ID,
      pointsToRedeem: 500,
    });

    expect(result.discountPercentage).toBe(10);
    expect(result.rewardType).toBe('DISCOUNT');
  });
});
