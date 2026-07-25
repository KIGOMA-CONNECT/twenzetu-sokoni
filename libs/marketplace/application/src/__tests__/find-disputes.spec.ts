import { FindMyDisputesUseCase, GetDisputeDetailUseCase } from '../lib/use-cases/dispute/find-disputes.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Dispute } from '@afri-market/marketplace-domain';

describe('FindMyDisputesUseCase', () => {
  let useCase: FindMyDisputesUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findByCustomerId: jest.fn(),
    };
    useCase = new FindMyDisputesUseCase(mockRepo);
  });

  it('should return empty array when no disputes found', async () => {
    mockRepo.findByCustomerId.mockResolvedValue([]);
    const result = await useCase.execute('cust-1');
    expect(result.data).toEqual([]);
  });

  it('should return disputes for customer', async () => {
    const dispute = Dispute.reconstitute({
      id: EntityId.from('d-1'),
      tenantId: TenantId.create('t-1'),
      orderId: EntityId.from('o-1'),
      customerId: EntityId.from('cust-1'),
      vendorId: EntityId.from('v-1'),
      reason: 'FOOD_COLD',
      description: 'Cold food',
      claimAmount: Money.create(5000),
      status: 'OPEN',
      severity: 'MEDIUM',
      version: 1,
    });
    mockRepo.findByCustomerId.mockResolvedValue([dispute]);
    const result = await useCase.execute('cust-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('d-1');
    expect(result.data[0].reason).toBe('FOOD_COLD');
  });
});

describe('GetDisputeDetailUseCase', () => {
  let useCase: GetDisputeDetailUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findById: jest.fn(),
    };
    useCase = new GetDisputeDetailUseCase(mockRepo);
  });

  it('should return null when dispute not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute('d-1');
    expect(result.data).toBeNull();
  });

  it('should return dispute detail', async () => {
    const dispute = Dispute.reconstitute({
      id: EntityId.from('d-1'),
      tenantId: TenantId.create('t-1'),
      orderId: EntityId.from('o-1'),
      customerId: EntityId.from('cust-1'),
      vendorId: EntityId.from('v-1'),
      reason: 'MISSING_ITEMS',
      description: 'Items missing',
      claimAmount: Money.create(3000),
      status: 'OPEN',
      severity: 'HIGH',
      version: 1,
    });
    mockRepo.findById.mockResolvedValue(dispute);
    const result = await useCase.execute('d-1');
    expect(result.data.id).toBe('d-1');
    expect(result.data.reason).toBe('MISSING_ITEMS');
    expect(result.data.claimAmount).toBe(3000);
  });
});
