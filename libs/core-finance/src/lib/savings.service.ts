import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsAccountEntity } from './entities/savings-account.entity';
import { SavingsTransactionEntity } from './entities/savings-transaction.entity';
import { FixedDepositEntity } from './entities/fixed-deposit.entity';

@Injectable()
export class SavingsService {
  private readonly logger = new Logger(SavingsService.name);

  // Interest rates by duration (annual)
  static readonly FD_RATES: Record<number, number> = {
    1: 0.06,   // 6% for 1 month
    3: 0.08,   // 8% for 3 months
    6: 0.10,   // 10% for 6 months
    12: 0.12,  // 12% for 1 year
    24: 0.14,  // 14% for 2 years
    36: 0.15,  // 15% for 3 years
    48: 0.16,  // 16% for 4 years
    60: 0.18,  // 18% for 5 years
  };

  constructor(
    @InjectRepository(SavingsAccountEntity)
    private readonly savingsRepo: Repository<SavingsAccountEntity>,
    @InjectRepository(SavingsTransactionEntity)
    private readonly txRepo: Repository<SavingsTransactionEntity>,
    @InjectRepository(FixedDepositEntity)
    private readonly fdRepo: Repository<FixedDepositEntity>,
  ) {}

  async getOrCreateAccount(ownerId: string, ownerType: string): Promise<SavingsAccountEntity> {
    let account = await this.savingsRepo.findOne({ where: { ownerId, ownerType } });
    if (!account) {
      account = this.savingsRepo.create({ ownerId, ownerType, balance: 0 });
      await this.savingsRepo.save(account);
    }
    return account;
  }

  async deposit(accountId: string, amount: number, reference?: string): Promise<SavingsTransactionEntity> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const account = await this.savingsRepo.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Savings account not found');
    if (account.status !== 'active') throw new BadRequestException('Account is not active');

    account.balance += amount;
    await this.savingsRepo.save(account);

    const tx = this.txRepo.create({
      accountId,
      type: 'deposit',
      amount,
      balanceAfter: account.balance,
      reference,
    });
    return this.txRepo.save(tx);
  }

  async withdraw(accountId: string, amount: number, reference?: string): Promise<SavingsTransactionEntity> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const account = await this.savingsRepo.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Savings account not found');
    if (account.status !== 'active') throw new BadRequestException('Account is not active');
    if (account.balance < amount) throw new BadRequestException('Insufficient balance');

    account.balance -= amount;
    await this.savingsRepo.save(account);

    const tx = this.txRepo.create({
      accountId,
      type: 'withdrawal',
      amount,
      balanceAfter: account.balance,
      reference,
    });
    return this.txRepo.save(tx);
  }

  async createFixedDeposit(accountId: string, principal: number, durationMonths: number): Promise<FixedDepositEntity> {
    if (principal <= 0) throw new BadRequestException('Principal must be positive');
    if (!SavingsService.FD_RATES[durationMonths]) {
      throw new BadRequestException(`Invalid duration. Allowed: ${Object.keys(SavingsService.FD_RATES).join(', ')} months`);
    }

    const account = await this.savingsRepo.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Savings account not found');
    if (account.balance < principal) throw new BadRequestException('Insufficient savings balance');

    const rate = SavingsService.FD_RATES[durationMonths];
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + durationMonths);

    // Compound interest: A = P(1 + r/n)^(nt)
    const maturityAmount = Math.round(principal * Math.pow(1 + rate / 12, durationMonths) * 100) / 100;

    // Freeze the principal
    account.balance -= principal;
    account.frozenBalance = (account.frozenBalance || 0) + principal;
    await this.savingsRepo.save(account);

    const fd = this.fdRepo.create({
      accountId,
      principal,
      interestRate: rate,
      durationMonths,
      maturityDate,
      maturityAmount,
      status: 'active',
    });

    const saved = await this.fdRepo.save(fd);

    // Record transaction
    await this.txRepo.save(this.txRepo.create({
      accountId,
      type: 'deposit',
      amount: principal,
      balanceAfter: account.balance,
      reference: `Fixed deposit created: ${durationMonths} months at ${(rate * 100).toFixed(1)}%`,
    }));

    return saved;
  }

  async getAccountTransactions(accountId: string, limit = 50): Promise<SavingsTransactionEntity[]> {
    return this.txRepo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async matureDueDeposits(): Promise<number> {
    const now = new Date();
    const due = await this.fdRepo.find({
      where: { status: 'active' },
    });
    let matured = 0;

    for (const fd of due) {
      if (fd.maturityDate > now) continue;

      const account = await this.savingsRepo.findOne({ where: { id: fd.accountId } });
      if (!account) continue;

      // Release the frozen principal back and credit the maturity amount
      const frozen = account.frozenBalance || 0;
      account.frozenBalance = Math.max(0, frozen - fd.principal);
      account.balance = Math.round((account.balance + fd.maturityAmount) * 100) / 100;
      await this.savingsRepo.save(account);

      fd.status = 'matured';
      fd.maturedAt = now;
      await this.fdRepo.save(fd);

      await this.txRepo.save(this.txRepo.create({
        accountId: fd.accountId,
        type: 'deposit',
        amount: fd.maturityAmount,
        balanceAfter: account.balance,
        reference: `Fixed deposit matured: ${fd.durationMonths} months at ${(fd.interestRate * 100).toFixed(1)}%`,
      }));

      matured += 1;
    }

    if (matured > 0) {
      this.logger.log(`Matured ${matured} fixed deposit(s)`);
    }
    return matured;
  }

  async getFixedDeposits(accountId: string): Promise<FixedDepositEntity[]> {
    return this.fdRepo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }

  getAvailableRates(): Record<number, { rate: number; label: string }> {
    const result: Record<number, { rate: number; label: string }> = {};
    for (const [months, rate] of Object.entries(SavingsService.FD_RATES)) {
      result[Number(months)] = {
        rate,
        label: Number(months) < 12 ? `${months} month${Number(months) > 1 ? 's' : ''}` : `${Number(months) / 12} year${Number(months) > 12 ? 's' : ''}`,
      };
    }
    return result;
  }
}
