import { EntityId, IRepository } from '@afri-market/kernel';
import { CreditScore } from './credit-score';

export interface ICreditScoreRepository extends IRepository<CreditScore, EntityId> {
  findByUserId(userId: string): Promise<CreditScore | null>;
}
