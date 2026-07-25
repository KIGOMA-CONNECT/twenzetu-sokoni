import { ListActiveBulkOrdersUseCase } from '../lib/use-cases/b2b/list-active-bulk-orders.use-case';
import { Money, TenantId } from '@afri-market/kernel';
import { BulkOrder } from '@afri-market/marketplace-domain';

describe('ListActiveBulkOrdersUseCase', () => {
  let useCase: ListActiveBulkOrdersUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findActiveByTenant: jest.fn(),
    };
    useCase = new ListActiveBulkOrdersUseCase(mockRepo);
  });

  it('should return empty when no bulk orders', async () => {
    mockRepo.findActiveByTenant.mockResolvedValue([]);
    const result = await useCase.execute('t-1');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should return active bulk orders', async () => {
    const order = BulkOrder.create({
      tenantId: TenantId.create('t-1'),
      sourceType: 'vendor',
      sourceName: 'Kigali Vendors',
      sourcePhone: '+250788123456',
      productName: 'Rice (25kg bags)',
      totalQuantity: 100,
      unit: 'bag',
      totalAmount: Money.create(500000),
    });
    mockRepo.findActiveByTenant.mockResolvedValue([order]);
    const result = await useCase.execute('t-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].productName).toBe('Rice (25kg bags)');
    expect(result.data[0].totalQuantity).toBe(100);
  });
});
