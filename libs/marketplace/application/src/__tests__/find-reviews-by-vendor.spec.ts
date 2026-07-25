import { FindReviewsByVendorUseCase } from '../lib/use-cases/review/find-reviews-by-vendor.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Review } from '@afri-market/marketplace-domain';

describe('FindReviewsByVendorUseCase', () => {
  let useCase: FindReviewsByVendorUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findByVendorId: jest.fn(),
    };
    useCase = new FindReviewsByVendorUseCase(mockRepo);
  });

  it('should return empty when no reviews', async () => {
    mockRepo.findByVendorId.mockResolvedValue([]);
    const result = await useCase.execute('vendor-1');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should return reviews for vendor', async () => {
    const review = Review.create({
      tenantId: TenantId.create('t-1'),
      customerId: EntityId.from('cust-1'),
      vendorId: EntityId.from('vendor-1'),
      orderId: EntityId.from('order-1'),
      rating: 5,
      comment: 'Great food!',
    });
    mockRepo.findByVendorId.mockResolvedValue([review]);
    const result = await useCase.execute('vendor-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].rating).toBe(5);
    expect(result.data[0].comment).toBe('Great food!');
    expect(result.total).toBe(1);
  });

  it('should handle review without comment', async () => {
    const review = Review.create({
      tenantId: TenantId.create('t-1'),
      customerId: EntityId.from('cust-1'),
      vendorId: EntityId.from('vendor-1'),
      orderId: EntityId.from('order-1'),
      rating: 4,
    });
    mockRepo.findByVendorId.mockResolvedValue([review]);
    const result = await useCase.execute('vendor-1');
    expect(result.data[0].comment).toBeUndefined();
  });
});
