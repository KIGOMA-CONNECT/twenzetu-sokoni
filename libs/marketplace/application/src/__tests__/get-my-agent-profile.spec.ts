import { GetMyAgentProfileUseCase } from '../lib/use-cases/agent/get-my-agent-profile.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { FieldAgent } from '@afri-market/marketplace-domain';

describe('GetMyAgentProfileUseCase', () => {
  let useCase: GetMyAgentProfileUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findByUserId: jest.fn(),
    };
    useCase = new GetMyAgentProfileUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should return null when no agent found', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      const result = await useCase.execute('user-1');
      expect(result.data).toBeNull();
    });

    it('should return agent profile', async () => {
      const agent = FieldAgent.reconstitute(EntityId.from('agent-1'), {
        tenantId: TenantId.create('t-1'),
        userId: EntityId.from('user-1'),
        agentType: 'VENDOR_ONBOARDER',
        agentCode: 'AGT001',
        coverageArea: 'Kigali',
        totalOnboarded: 5,
        totalEarnings: Money.create(50000),
        commissionRate: 5,
        status: 'ACTIVE',
        version: 1,
      });
      mockRepo.findByUserId.mockResolvedValue(agent);
      const result = await useCase.execute('user-1');
      expect(result.data).not.toBeNull();
      expect(result.data.agentType).toBe('VENDOR_ONBOARDER');
      expect(result.data.coverageArea).toBe('Kigali');
    });
  });

  describe('getEarnings', () => {
    it('should return empty when no agent', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      const result = await useCase.getEarnings('user-1');
      expect(result.data).toEqual([]);
    });

    it('should return earnings summary', async () => {
      const agent = FieldAgent.reconstitute(EntityId.from('agent-1'), {
        tenantId: TenantId.create('t-1'),
        userId: EntityId.from('user-1'),
        agentType: 'DRIVER',
        agentCode: 'DRV001',
        coverageArea: 'Downtown',
        totalOnboarded: 0,
        totalEarnings: Money.create(100000),
        commissionRate: 10,
        status: 'ACTIVE',
        version: 1,
      });
      mockRepo.findByUserId.mockResolvedValue(agent);
      const result = await useCase.getEarnings('user-1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].commissionRate).toBe(10);
    });
  });
});
