import { Inject, Injectable } from '@nestjs/common';
import { IReviewRepository } from '@afri-market/marketplace-domain';
import { REVIEW_REPOSITORY } from '../../tokens';

@Injectable()
export class FindMyReviewedOrdersUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: IReviewRepository,
  ) {}

  public async execute(customerId: string): Promise<{ orderIds: string[] }> {
    const orderIds = await this.reviewRepo.findReviewedOrderIdsByCustomer(customerId);
    return { orderIds };
  }
}
