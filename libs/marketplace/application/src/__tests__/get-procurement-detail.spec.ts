import { GetProcurementDetailUseCase } from '../lib/use-cases/procurement/get-procurement-detail.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { CustomProcurement } from '@afri-market/marketplace-domain';

describe('GetProcurementDetailUseCase', () => {
  let useCase: GetProcurementDetailUseCase;
  let mockProcurementRepo: Record<string, jest.Mock>;
  let mockQuoteRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProcurementRepo = {
      findById: jest.fn(),
    };
    mockQuoteRepo = {
      findByProcurementId: jest.fn(),
    };
    useCase = new GetProcurementDetailUseCase(mockProcurementRepo, mockQuoteRepo);
  });

  it('should return null when procurement not found', async () => {
    mockProcurementRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute('t-1', 'proc-1');
    expect(result.procurement).toBeNull();
    expect(result.quotes).toEqual([]);
  });

  it('should return procurement with quotes', async () => {
    const procurement = CustomProcurement.create({
      tenantId: TenantId.create('t-1'),
      customerId: EntityId.from('cust-1'),
      productQuery: 'iPhone 15 Pro',
    });
    mockProcurementRepo.findById.mockResolvedValue(procurement);
    mockQuoteRepo.findByProcurementId.mockResolvedValue([]);
    const result = await useCase.execute('t-1', procurement.id.value);
    expect(result.procurement).not.toBeNull();
    expect(result.procurement.productQuery).toBe('iPhone 15 Pro');
  });
});
