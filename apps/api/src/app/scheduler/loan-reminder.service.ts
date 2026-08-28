import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class LoanReminderService {
  private readonly logger = new Logger(LoanReminderService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleLoanReminders(): Promise<void> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const dueLoans = await this.dataSource.query(
      `SELECT id, borrower_id, borrower_type, due_date, remaining_balance
       FROM loans
       WHERE status = 'active'
         AND due_date IS NOT NULL
         AND due_date <= $1
         AND due_date > $2`,
      [threeDaysFromNow, now],
    );

    if (dueLoans.length === 0) {
      return;
    }

    for (const loan of dueLoans) {
      this.logger.log(
        `Loan reminder: loan ${loan.id} (borrower ${loan.borrower_id}) due on ${loan.due_date} — outstanding balance: ${loan.remaining_balance} TZS`,
      );
    }

    this.logger.log(`Loan reminder check complete: ${dueLoans.length} loan(s) approaching due date`);
  }
}
