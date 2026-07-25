import { CreateSurgeRuleUseCase, ListSurgeRulesUseCase } from '../lib/use-cases/surge/list-surge-rules.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { SurgeRule } from '@afri-market/marketplace-domain';

describe('ListSurgeRulesUseCase', () => {
  let useCase: ListSurgeRulesUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findActiveByTenant: jest.fn(),
    };
    useCase = new ListSurgeRulesUseCase(mockRepo);
  });

  it('should return empty when no rules', async () => {
    mockRepo.findActiveByTenant.mockResolvedValue([]);
    const result = await useCase.execute('t-1');
    expect(result.data).toEqual([]);
  });

  it('should return active rules for tenant', async () => {
    const rule = SurgeRule.reconstitute({
      id: EntityId.from('r-1'),
      tenantId: TenantId.create('t-1'),
      name: 'Night Surge',
      trigger: 'NIGHT_TIME',
      multiplier: 1.5,
      minOrders: 5,
      maxDrivers: 10,
      startHour: 22,
      endHour: 6,
      isActive: true,
      version: 1,
    });
    mockRepo.findActiveByTenant.mockResolvedValue([rule]);
    const result = await useCase.execute('t-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Night Surge');
    expect(result.data[0].multiplier).toBe(1.5);
  });
});

describe('CreateSurgeRuleUseCase', () => {
  let useCase: CreateSurgeRuleUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      save: jest.fn(),
    };
    useCase = new CreateSurgeRuleUseCase(mockRepo);
  });

  it('should create a surge rule', async () => {
    const result = await useCase.execute('t-1', {
      name: 'Rain Surge',
      trigger: 'WEATHER',
      multiplier: 1.3,
    });
    expect(result.surgeRuleId).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create surge rule with optional params', async () => {
    const result = await useCase.execute('t-1', {
      name: 'Event Surge',
      trigger: 'EVENT',
      multiplier: 2.0,
      minOrders: 10,
      maxDrivers: 20,
      startHour: 18,
      endHour: 23,
    });
    expect(result.surgeRuleId).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
