import { CreateUsedGoodsUseCase } from '../lib/use-cases/used-goods/create-used-goods.use-case';
import { GetUsedGoodsUseCase } from '../lib/use-cases/used-goods/get-used-goods.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';

describe('CreateUsedGoodsUseCase', () => {
  let useCase: CreateUsedGoodsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = { save: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateUsedGoodsUseCase(mockRepo);
  });

  it('should create a used goods listing', async () => {
    const result = await useCase.execute('test-tenant', {
      sellerId: 'seller-1',
      sellerName: 'John',
      sellerPhone: '+250788000000',
      title: 'Used Phone',
      category: 'electronics',
      askingPrice: 50000,
      location: 'Kigali',
      condition: 'good',
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Used Phone');
    expect(result.status).toBe('AVAILABLE');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create with optional fields', async () => {
    const result = await useCase.execute('test-tenant', {
      sellerId: 'seller-1',
      sellerName: 'John',
      sellerPhone: '+250788000000',
      title: 'Used Laptop',
      description: 'Good condition',
      category: 'electronics',
      askingPrice: 200000,
      currency: 'USD',
      location: 'Nairobi',
      latitude: -1.2921,
      longitude: 36.8219,
      condition: 'like_new',
      photoUrls: ['http://img1.jpg'],
    });

    expect(result.title).toBe('Used Laptop');
  });
});

describe('GetUsedGoodsUseCase', () => {
  let useCase: GetUsedGoodsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetUsedGoodsUseCase(mockRepo);
  });

  it('should throw if listing not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('test-tenant', 'nonexistent')).rejects.toThrow('not found');
  });

  it('should throw if tenant mismatch', async () => {
    const { UsedGoods } = await import('@afri-market/marketplace-domain');
    mockRepo.findById.mockResolvedValue(
      UsedGoods.reconstitute({
        id: EntityId.from('listing-1'),
        tenantId: TenantId.create('other-tenant'),
        sellerId: EntityId.from('seller-1'),
        sellerName: 'John',
        sellerPhone: '+250788000000',
        title: 'Used Phone',
        category: 'electronics',
        askingPrice: (await import('@afri-market/kernel')).Money.create(50000),
        status: 'AVAILABLE',
        location: 'Kigali',
        condition: 'good',
        views: 0,
        version: 1,
      })
    );

    await expect(useCase.execute('test-tenant', 'listing-1')).rejects.toThrow('not found');
  });
});
