import { CalculateSurgeUseCase } from '../lib/use-cases/surge/calculate-surge.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { SurgeRule } from '@afri-market/marketplace-domain';

describe('CalculateSurgeUseCase', () => {
  let useCase: CalculateSurgeUseCase;
  let mockSurgeRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findActiveByTenant: jest.Mock;
    findByTrigger: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };
  let dateSpy: jest.SpyInstance;

  const TENANT_ID = 'test-tenant';

  beforeEach(() => {
    jest.clearAllMocks();

    mockSurgeRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findActiveByTenant: jest.fn(),
      findByTrigger: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    useCase = new CalculateSurgeUseCase(mockSurgeRepo);
    dateSpy = jest.spyOn(Date.prototype, 'getHours');
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  const createSurgeRule = (overrides: {
    multiplier: number;
    startHour?: number;
    endHour?: number;
    isActive?: boolean;
  }) =>
    SurgeRule.reconstitute({
      id: EntityId.from(`rule-${overrides.multiplier}`),
      tenantId: TenantId.create(TENANT_ID),
      name: `Surge ${overrides.multiplier}x`,
      trigger: 'DEMAND_SUPPLY',
      multiplier: overrides.multiplier,
      minOrders: 10,
      maxDrivers: 5,
      startHour: overrides.startHour,
      endHour: overrides.endHour,
      isActive: overrides.isActive ?? true,
      version: 1,
    });

  const baseParams = {
    baseFare: 1000,
    distanceKm: 5,
    perKmRate: 200,
    durationMinutes: 15,
    perMinuteRate: 50,
  };

  it('should return 1.0 multiplier when no surge rules active', async () => {
    dateSpy.mockReturnValue(12);
    mockSurgeRepo.findActiveByTenant.mockResolvedValue([]);

    const result = await useCase.execute(TENANT_ID, baseParams);

    expect(result.surgeMultiplier).toBe(1.0);
    expect(result.totalFare).toBe(2750);
    expect(result.breakdown.baseFare).toBe(1000);
    expect(result.breakdown.distanceFare).toBe(1000);
    expect(result.breakdown.timeFare).toBe(750);
    expect(result.breakdown.subtotal).toBe(2750);
    expect(result.breakdown.surge).toBe(0);
  });

  it('should apply correct surge multiplier during matching time window', async () => {
    dateSpy.mockReturnValue(20);

    const surgeRule = createSurgeRule({
      multiplier: 1.5,
      startHour: 18,
      endHour: 23,
      isActive: true,
    });
    mockSurgeRepo.findActiveByTenant.mockResolvedValue([surgeRule]);

    const result = await useCase.execute(TENANT_ID, baseParams);

    expect(result.surgeMultiplier).toBe(1.5);
    expect(result.totalFare).toBe(4125);
    expect(result.breakdown.surge).toBe(1375);
  });

  it('should pick highest multiplier when multiple rules match', async () => {
    dateSpy.mockReturnValue(20);

    const rule1 = createSurgeRule({
      multiplier: 1.5,
      startHour: 18,
      endHour: 23,
      isActive: true,
    });
    const rule2 = createSurgeRule({
      multiplier: 2.0,
      startHour: 19,
      endHour: 22,
      isActive: true,
    });
    mockSurgeRepo.findActiveByTenant.mockResolvedValue([rule1, rule2]);

    const result = await useCase.execute(TENANT_ID, baseParams);

    expect(result.surgeMultiplier).toBe(2.0);
    expect(result.totalFare).toBe(5500);
    expect(result.breakdown.surge).toBe(2750);
  });

  it('should not apply surge for rules outside time window', async () => {
    dateSpy.mockReturnValue(10);

    const surgeRule = createSurgeRule({
      multiplier: 2.0,
      startHour: 18,
      endHour: 23,
      isActive: true,
    });
    mockSurgeRepo.findActiveByTenant.mockResolvedValue([surgeRule]);

    const result = await useCase.execute(TENANT_ID, baseParams);

    expect(result.surgeMultiplier).toBe(1.0);
    expect(result.totalFare).toBe(2750);
  });

  it('should skip inactive rules', async () => {
    dateSpy.mockReturnValue(20);

    const inactiveRule = createSurgeRule({
      multiplier: 3.0,
      startHour: 18,
      endHour: 23,
      isActive: false,
    });
    mockSurgeRepo.findActiveByTenant.mockResolvedValue([inactiveRule]);

    const result = await useCase.execute(TENANT_ID, baseParams);

    expect(result.surgeMultiplier).toBe(1.0);
    expect(result.totalFare).toBe(2750);
  });

  it('should apply surge for rules without time window', async () => {
    dateSpy.mockReturnValue(12);

    const alwaysActiveRule = createSurgeRule({
      multiplier: 1.8,
      isActive: true,
    });
    mockSurgeRepo.findActiveByTenant.mockResolvedValue([alwaysActiveRule]);

    const result = await useCase.execute(TENANT_ID, baseParams);

    expect(result.surgeMultiplier).toBe(1.8);
    expect(result.breakdown.surge).toBeGreaterThan(0);
  });

  it('should calculate breakdown correctly', async () => {
    dateSpy.mockReturnValue(12);
    mockSurgeRepo.findActiveByTenant.mockResolvedValue([]);

    const result = await useCase.execute(TENANT_ID, {
      baseFare: 2000,
      distanceKm: 10,
      perKmRate: 300,
      durationMinutes: 30,
      perMinuteRate: 100,
    });

    expect(result.breakdown).toEqual({
      baseFare: 2000,
      distanceFare: 3000,
      timeFare: 3000,
      subtotal: 8000,
      surge: 0,
    });
    expect(result.totalFare).toBe(8000);
  });
});
