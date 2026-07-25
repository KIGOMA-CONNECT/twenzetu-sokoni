import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { WalletTransaction, IWalletTransactionRepository } from '@afri-market/marketplace-domain';
import { WALLET_TRANSACTION_REPOSITORY } from '../../tokens';

@Injectable()
export class ListWalletTransactionsUseCase {
  constructor(
    @Inject(WALLET_TRANSACTION_REPOSITORY) private readonly txRepo: IWalletTransactionRepository,
  ) {}

  public async execute(
    tenantId: string,
    ownerId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<{ data: WalletTransaction[]; total: number }> {
    return this.txRepo.findByOwnerId(tenantId, ownerId, opts);
  }
}
