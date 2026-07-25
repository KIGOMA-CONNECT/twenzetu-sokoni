import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { MicroLoan, IMicroLoanRepository, LoanType } from '@afri-market/marketplace-domain';
import { MICRO_LOAN_REPOSITORY } from '../../tokens';

@Injectable()
export class RequestLoanUseCase {
  constructor(
    @Inject(MICRO_LOAN_REPOSITORY) private readonly loanRepo: IMicroLoanRepository,
  ) {}

  public async execute(tenantId: string, params: {
    borrowerId: string;
    borrowerType: 'vendor' | 'driver';
    loanType: string;
    requestedAmount: number;
    interestRate: number;
    dailyRepaymentAmount: number;
    totalDays: number;
  }): Promise<{ loanId: string; status: string }> {
    const loan = MicroLoan.create({
      tenantId: TenantId.create(tenantId),
      borrowerId: EntityId.from(params.borrowerId),
      borrowerType: params.borrowerType,
      loanType: params.loanType as LoanType,
      requestedAmount: Money.create(params.requestedAmount),
      interestRate: params.interestRate,
      dailyRepaymentAmount: Money.create(params.dailyRepaymentAmount),
      totalDays: params.totalDays,
    });

    await this.loanRepo.save(loan);

    return { loanId: loan.id.value, status: loan.status };
  }
}
