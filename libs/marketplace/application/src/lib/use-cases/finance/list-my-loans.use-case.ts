import { Injectable, Inject } from '@nestjs/common';
import { IMicroLoanRepository } from '@afri-market/marketplace-domain';
import { MICRO_LOAN_REPOSITORY } from '../../tokens';

@Injectable()
export class ListMyLoansUseCase {
  constructor(
    @Inject(MICRO_LOAN_REPOSITORY) private readonly loanRepo: IMicroLoanRepository,
  ) {}

  public async execute(borrowerId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const loans = await this.loanRepo.findByBorrowerId(borrowerId);
    const mapped = loans.map(l => ({
      id: l.id.value,
      loanType: l.loanType,
      requestedAmount: l.requestedAmount.amount,
      approvedAmount: l.approvedAmount?.amount ?? null,
      outstandingBalance: l.outstandingBalance.amount,
      status: l.status,
      repaidDays: l.repaidDays,
      totalDays: l.totalDays,
    }));
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? mapped.length;
    return {
      data: mapped.slice(offset, offset + limit),
      total: loans.length,
    };
  }
}
