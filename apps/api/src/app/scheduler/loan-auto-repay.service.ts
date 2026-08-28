import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class LoanAutoRepayService {
  private readonly logger = new Logger(LoanAutoRepayService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleAutoRepayment(): Promise<void> {
    const overdueLoans = await this.dataSource.query(
      `SELECT l.id, l.tenant_id, l.borrower_id, l.remaining_balance, l.monthly_payment, l.due_date
       FROM loans l
       WHERE l.status = 'active'
         AND l.due_date IS NOT NULL
         AND l.due_date <= NOW()`,
    );

    if (overdueLoans.length === 0) {
      return;
    }

    this.logger.log(`Auto-repayment: found ${overdueLoans.length} overdue loan(s)`);

    for (const loan of overdueLoans) {
      try {
        const repayAmount = Math.min(loan.monthly_payment, loan.remaining_balance);

        const walletResult = await this.dataSource.query(
          `UPDATE wallets SET balance = balance - $1, version = version + 1
           WHERE owner_id = $2 AND tenant_id = $3 AND balance >= $1
           RETURNING id, balance`,
          [repayAmount, loan.borrower_id, loan.tenant_id],
        );

        if (walletResult.length === 0) {
          this.logger.warn(`Auto-repay: insufficient wallet balance for loan ${loan.id}`);
          continue;
        }

        const walletId = walletResult[0].id;
        const balanceAfter = parseFloat(walletResult[0].balance);

        await this.dataSource.query(
          `INSERT INTO loan_repayments (tenant_id, loan_id, amount, balance_before, balance_after, currency, payment_method, reference, created_at)
           VALUES ($1, $2, $3, $4, $5, 'TZS', 'wallet_auto_debit', $6, NOW())`,
          [loan.tenant_id, loan.id, repayAmount, balanceAfter + repayAmount, balanceAfter, `auto-repay-${Date.now()}`],
        );

        const newBalance = loan.remaining_balance - repayAmount;
        const newStatus = newBalance <= 0 ? 'paid' : 'active';
        await this.dataSource.query(
          `UPDATE loans SET remaining_balance = $1, status = $2, updated_at = NOW() WHERE id = $3`,
          [Math.max(0, newBalance), newStatus, loan.id],
        );

        await this.dataSource.query(
          `INSERT INTO wallet_transactions (tenant_id, wallet_id, type, amount, balance_before, balance_after, reference_type, reference_id, currency, created_at)
           VALUES ($1, $2, 'DEBIT', $3, $4, $5, 'loan_auto_repayment', $6, 'TZS', NOW())`,
          [loan.tenant_id, walletId, repayAmount, balanceAfter + repayAmount, balanceAfter, loan.id],
        );

        this.logger.log(`Auto-repay: loan ${loan.id} repaid ${repayAmount} TZS, remaining: ${Math.max(0, newBalance)} TZS`);
      } catch (error) {
        this.logger.error(`Auto-repay failed for loan ${loan.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.logger.log(`Auto-repayment complete: processed ${overdueLoans.length} loan(s)`);
  }
}
