import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Wallet, IWalletRepository } from '@afri-market/marketplace-domain';
import { WALLET_REPOSITORY } from '../../tokens';

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepo: IWalletRepository,
  ) {}

  public async execute(
    tenantId: string,
    ownerId: string,
  ): Promise<{ id: string; balance: number; pendingBalance: number; currency: string }> {
    let wallet = await this.walletRepo.findByOwnerId(ownerId);
    if (!wallet) {
      wallet = Wallet.create({
        tenantId: TenantId.create(tenantId),
        ownerId: EntityId.from(ownerId),
        ownerType: 'vendor',
      });
      await this.walletRepo.save(wallet);
    }

    return {
      id: wallet.id.value,
      balance: wallet.balance.amount,
      pendingBalance: wallet.pendingBalance.amount,
      currency: wallet.balance.currency,
    };
  }
}
