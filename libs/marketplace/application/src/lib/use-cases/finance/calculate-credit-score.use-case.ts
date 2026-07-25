import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { CreditScore, ICreditScoreRepository } from '@afri-market/marketplace-domain';
import { CREDIT_SCORE_REPOSITORY } from '../../tokens';

@Injectable()
export class CalculateCreditScoreUseCase {
  constructor(
    @Inject(CREDIT_SCORE_REPOSITORY) private readonly creditScoreRepo: ICreditScoreRepository,
  ) {}

  public async execute(tenantId: string, params: {
    userId: string;
    totalTransactions?: number;
    totalRevenue?: number;
    averageDailySales?: number;
    accountAgeDays?: number;
    missedDeliveries?: number;
    disputeCount?: number;
  }): Promise<{ userId: string; score: number; lastCalculatedAt: Date }> {
    let creditScore = await this.creditScoreRepo.findByUserId(params.userId);

    if (!creditScore) {
      creditScore = CreditScore.create({
        tenantId: TenantId.create(tenantId),
        userId: EntityId.from(params.userId),
        totalTransactions: params.totalTransactions,
        totalRevenue: params.totalRevenue != null ? Money.create(params.totalRevenue) : undefined,
        averageDailySales: params.averageDailySales != null ? Money.create(params.averageDailySales) : undefined,
        accountAgeDays: params.accountAgeDays,
        missedDeliveries: params.missedDeliveries,
        disputeCount: params.disputeCount,
      });
    }

    const score = creditScore.calculateScore();
    await this.creditScoreRepo.save(creditScore);

    return { userId: params.userId, score, lastCalculatedAt: creditScore.lastCalculatedAt };
  }
}
