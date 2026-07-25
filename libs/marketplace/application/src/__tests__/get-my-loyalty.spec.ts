import { GetMyLoyaltyUseCase } from '../lib/use-cases/loyalty/get-my-loyalty.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { CustomerPoints } from '@afri-market/marketplace-domain';

describe('GetMyLoyaltyUseCase', () => {
  let useCase: GetMyLoyaltyUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findByCustomerId: jest.fn(),
    };
    useCase = new GetMyLoyaltyUseCase(mockRepo);
  });

  describe('getPoints', () => {
    it('should return default points when none found', async () => {
      mockRepo.findByCustomerId.mockResolvedValue(null);
      const result = await useCase.getPoints('cust-1');
      expect(result.totalPoints).toBe(0);
      expect(result.redeemablePoints).toBe(0);
      expect(result.tier).toBe('BRONZE');
    });

    it('should return actual points', async () => {
      const points = CustomerPoints.reconstitute({
        id: EntityId.from('cp-1'),
        tenantId: TenantId.create('t-1'),
        customerId: EntityId.from('cust-1'),
        totalPoints: 500,
        redeemablePoints: 300,
        lifetimePoints: 1000,
        tier: 'SILVER',
        referralCode: undefined,
        referredBy: undefined,
        totalReferrals: 0,
        freeDeliveriesRemaining: 2,
        version: 1,
      });
      mockRepo.findByCustomerId.mockResolvedValue(points);
      const result = await useCase.getPoints('cust-1');
      expect(result.totalPoints).toBe(500);
      expect(result.redeemablePoints).toBe(300);
    });
  });

  describe('getTier', () => {
    it('should return default tier when none found', async () => {
      mockRepo.findByCustomerId.mockResolvedValue(null);
      const result = await useCase.getTier('cust-1');
      expect(result.tier).toBe('BRONZE');
      expect(result.lifetimePoints).toBe(0);
    });

    it('should return actual tier', async () => {
      const points = CustomerPoints.reconstitute({
        id: EntityId.from('cp-1'),
        tenantId: TenantId.create('t-1'),
        customerId: EntityId.from('cust-1'),
        totalPoints: 2000,
        redeemablePoints: 1500,
        lifetimePoints: 5000,
        tier: 'GOLD',
        referralCode: undefined,
        referredBy: undefined,
        totalReferrals: 0,
        freeDeliveriesRemaining: 3,
        version: 1,
      });
      mockRepo.findByCustomerId.mockResolvedValue(points);
      const result = await useCase.getTier('cust-1');
      expect(result.lifetimePoints).toBe(5000);
      expect(result.tier).toBe('GOLD');
    });
  });
});
