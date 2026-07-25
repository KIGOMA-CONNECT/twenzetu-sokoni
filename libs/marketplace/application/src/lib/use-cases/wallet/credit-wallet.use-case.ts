import { Injectable, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import {
  Wallet,
  WalletTransaction,
  IWalletRepository,
  IWalletTransactionRepository,
} from '@afri-market/marketplace-domain';
import { WALLET_REPOSITORY, WALLET_TRANSACTION_REPOSITORY } from '../../tokens';

@Injectable()
export class CreditWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepo: IWalletRepository,
    @Inject(WALLET_TRANSACTION_REPOSITORY) private readonly txRepo: IWalletTransactionRepository,
  ) {}

  public async execute(
    tenantId: string,
    ownerId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<{ walletId: string; balance: number }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    let wallet = await this.walletRepo.findByOwnerId(ownerId);
    const balanceBefore = wallet ? wallet.balance.amount : 0;

    if (!wallet) {
      wallet = Wallet.create({
        tenantId: TenantId.create(tenantId),
        ownerId: EntityId.from(ownerId),
        ownerType: 'vendor',
      });
    }

    wallet.credit(Money.create(amount));
    await this.walletRepo.save(wallet);

    const tx = WalletTransaction.create({
      tenantId: TenantId.create(tenantId),
      ownerId: EntityId.from(ownerId),
      ownerType: wallet.ownerType,
      type: 'CREDIT',
      amount: Money.create(amount),
      balanceBefore,
      balanceAfter: wallet.balance.amount,
      description,
      referenceId,
      referenceType,
    });
    await this.txRepo.save(tx);

    return { walletId: wallet.id.value, balance: wallet.balance.amount };
  }
}
