import { EntityId, IRepository } from '@afri-market/kernel';
import { Wallet } from './wallet.aggregate';

export interface IWalletRepository extends IRepository<Wallet, EntityId> {
  findByOwnerId(ownerId: string, tenantId?: string): Promise<Wallet | null>;
}
