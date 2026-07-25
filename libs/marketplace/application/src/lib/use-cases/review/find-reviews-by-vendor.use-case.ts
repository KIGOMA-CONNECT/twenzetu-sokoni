import { Injectable, Inject } from '@nestjs/common';
import { IReviewRepository } from '@afri-market/marketplace-domain';
import { REVIEW_REPOSITORY } from '../../tokens';

@Injectable()
export class FindReviewsByVendorUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: IReviewRepository,
  ) {}

  public async execute(vendorId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const reviews = await this.reviewRepo.findByVendorId(vendorId);
    const mapped = reviews.map(r => ({
      id: r.id.value,
      customerId: r.customerId.value,
      vendorId: r.vendorId.value,
      orderId: r.orderId.value,
      rating: r.rating,
      comment: r.comment,
    }));
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? mapped.length;
    return {
      data: mapped.slice(offset, offset + limit),
      total: reviews.length,
    };
  }
}
