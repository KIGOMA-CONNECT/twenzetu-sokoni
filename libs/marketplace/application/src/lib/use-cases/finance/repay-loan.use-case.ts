import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import { IMicroLoanRepository } from '@afri-market/marketplace-domain';
import { MICRO_LOAN_REPOSITORY } from '../../tokens';

@Injectable()
export class RepayLoanUseCase {
  constructor(
    @Inject(MICRO_LOAN_REPOSITORY) private readonly loanRepo: IMicroLoanRepository,
  ) {}

  public async execute(params: {
    loanId: string;
    amount: number;
    actor?: { tenantId: string; borrowerId: string };
  }): Promise<{
    loanId: string;
    status: string;
    remainingBalance: number;
    repaidDays: number;
  }> {
    const loan = await this.loanRepo.findById(EntityId.from(params.loanId));
    if (!loan) throw new NotFoundException('Loan not found');
    if (params.actor) {
      if (loan.tenantId.value !== params.actor.tenantId || loan.borrowerId.value !== params.actor.borrowerId) {
        throw new NotFoundException('Loan not found');
      }
    }

    loan.repay(Money.create(params.amount));
    await this.loanRepo.save(loan);

    return {
      loanId: loan.id.value,
      status: loan.status,
      remainingBalance: loan.outstandingBalance.amount,
      repaidDays: loan.repaidDays,
    };
  }
}
