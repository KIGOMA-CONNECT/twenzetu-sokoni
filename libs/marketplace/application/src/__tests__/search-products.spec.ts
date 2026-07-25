import { SearchProductsUseCase } from '../lib/use-cases/product/search-products.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Product } from '@afri-market/marketplace-domain';

describe('SearchProductsUseCase', () => {
  let useCase: SearchProductsUseCase;
  let mockProductRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';

  beforeEach(() => {
    jest.clearAllMocks();
    mockProductRepo = { searchWithFilters: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    useCase = new SearchProductsUseCase(mockProductRepo);
  });

  it('should search products with default options', async () => {
    await useCase.execute(TENANT_ID);

    expect(mockProductRepo.searchWithFilters).toHaveBeenCalledWith(TENANT_ID, {});
  });

  it('should search with text and price range', async () => {
    const product = Product.reconstitute({
      id: EntityId.from('p1'),
      tenantId: TenantId.create(TENANT_ID),
      vendorId: EntityId.from('v1'),
      name: 'Chicken Wings',
      description: 'Spicy wings',
      price: Money.create(3000),
      category: 'food',
      status: 'ACTIVE',
      version: 1,
    });
    mockProductRepo.searchWithFilters.mockResolvedValue({ data: [product], total: 1 });

    const result = await useCase.execute(TENANT_ID, {
      search: 'wings',
      minPrice: 1000,
      maxPrice: 5000,
    });

    expect(mockProductRepo.searchWithFilters).toHaveBeenCalledWith(TENANT_ID, {
      search: 'wings',
      minPrice: 1000,
      maxPrice: 5000,
    });
    expect(result.total).toBe(1);
  });

  it('should search with category filter', async () => {
    await useCase.execute(TENANT_ID, { categoryId: 'cat-1', limit: 10 });

    expect(mockProductRepo.searchWithFilters).toHaveBeenCalledWith(TENANT_ID, {
      categoryId: 'cat-1',
      limit: 10,
    });
  });

  it('should search with pagination', async () => {
    await useCase.execute(TENANT_ID, { limit: 5, offset: 10 });

    expect(mockProductRepo.searchWithFilters).toHaveBeenCalledWith(TENANT_ID, {
      limit: 5,
      offset: 10,
    });
  });
});
