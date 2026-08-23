import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { MicroLoanOrmEntity } from '@afri-market/marketplace-infrastructure';

@Injectable()
export class LoanReminderService {
  private readonly logger = new Logger(LoanReminderService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleLoanReminders(): Promise<void> {
    const repo = this.dataSource.getRepository(MicroLoanOrmEntity);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const dueLoans = await repo
      .createQueryBuilder('loan')
      .where('loan.status = :status', { status: 'DISBURSED' })
      .andWhere('loan."due_at" IS NOT NULL')
      .andWhere('loan."due_at" <= :threeDays', { threeDays: threeDaysFromNow })
      .andWhere('loan."due_at" > :now', { now })
      .getMany();

    if (dueLoans.length === 0) {
      return;
    }

    for (const loan of dueLoans) {
      this.logger.log(
        `Loan reminder: loan ${loan.id} (borrower ${loan.borrowerId}) due on ${loan.dueAt} — outstanding balance: ${loan.outstandingBalance} ${loan.currency}`,
      );
    }

    this.logger.log(`Loan reminder check complete: ${dueLoans.length} loan(s) approaching due date`);
  }
}
