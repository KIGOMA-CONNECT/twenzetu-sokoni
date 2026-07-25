import { EntityId, IRepository } from '@afri-market/kernel';
import { WalletTransaction } from './wallet-transaction.aggregate';

export interface IWalletTransactionRepository extends IRepository<WalletTransaction, EntityId> {
  findByOwnerId(
    tenantId: string,
    ownerId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<{ data: WalletTransaction[]; total: number }>;
}
