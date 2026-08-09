import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanEntity } from './entities/loan.entity';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  static readonly LOAN_RATES = {
    vendor: { annual: 0.15, minAmount: 50000, maxAmount: 10000000, maxTerm: 24 },
    driver: { annual: 0.15, minAmount: 20000, maxAmount: 5000000, maxTerm: 12 },
    customer: { annual: 0.18, minAmount: 10000, maxAmount: 2000000, maxTerm: 6 },
  };

  constructor(
    @InjectRepository(LoanEntity)
    private readonly loanRepo: Repository<LoanEntity>,
    @InjectRepository(LoanRepaymentEntity)
    private readonly repaymentRepo: Repository<LoanRepaymentEntity>,
  ) {}

  async applyLoan(params: {
    borrowerId: string;
    borrowerType: 'vendor' | 'driver' | 'customer';
    principal: number;
    termMonths: number;
    collateral?: string;
    purpose?: string;
  }): Promise<LoanEntity> {
    const config = LoanService.LOAN_RATES[params.borrowerType];
    if (!config) throw new BadRequestException('Invalid borrower type');
    if (params.principal < config.minAmount || params.principal > config.maxAmount) {
      throw new BadRequestException(`Amount must be between ${config.minAmount} and ${config.maxAmount}`);
    }
    if (params.termMonths > config.maxTerm) {
      throw new BadRequestException(`Max term for ${params.borrowerType} is ${config.maxTerm} months`);
    }

    const monthlyRate = config.annual / 12;
    const monthlyPayment = Math.round(
      (params.principal * monthlyRate * Math.pow(1 + monthlyRate, params.termMonths)) /
      (Math.pow(1 + monthlyRate, params.termMonths) - 1) * 100
    ) / 100;

    const loan = this.loanRepo.create({
      borrowerId: params.borrowerId,
      borrowerType: params.borrowerType,
      principal: params.principal,
      interestRate: config.annual,
      termMonths: params.termMonths,
      monthlyPayment,
      remainingBalance: params.principal,
      collateral: params.collateral,
      purpose: params.purpose,
      status: 'pending',
    });

    return this.loanRepo.save(loan);
  }

  async approveLoan(loanId: string): Promise<LoanEntity> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'pending') throw new BadRequestException('Loan is not pending');

    loan.status = 'approved';
    loan.approvedAt = new Date();
    return this.loanRepo.save(loan);
  }

  async disburseLoan(loanId: string): Promise<LoanEntity> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'approved') throw new BadRequestException('Loan must be approved first');

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loan.termMonths);

    loan.status = 'active';
    loan.disbursedAt = new Date();
    loan.dueDate = dueDate;
    return this.loanRepo.save(loan);
  }

  private async getOwnedLoan(loanId: string, borrowerId?: string): Promise<LoanEntity> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (borrowerId && loan.borrowerId !== borrowerId) {
      throw new NotFoundException('Loan not found');
    }
    return loan;
  }

  async makeRepayment(loanId: string, amount: number, borrowerId?: string): Promise<LoanRepaymentEntity> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const loan = await this.getOwnedLoan(loanId, borrowerId);
    if (loan.status !== 'active') throw new BadRequestException('Loan is not active');
    if (amount > loan.remainingBalance) throw new BadRequestException('Amount exceeds remaining balance');

    const monthlyRate = loan.interestRate / 12;
    const interestPortion = Math.round(loan.remainingBalance * monthlyRate * 100) / 100;
    const principalPortion = Math.round((amount - interestPortion) * 100) / 100;
    const newBalance = Math.round((loan.remainingBalance - principalPortion) * 100) / 100;

    const repayment = this.repaymentRepo.create({
      loanId,
      amount,
      principalPortion,
      interestPortion,
      remainingBalance: Math.max(newBalance, 0),
    });

    loan.totalRepaid += amount;
    loan.remainingBalance = Math.max(newBalance, 0);
    if (loan.remainingBalance <= 0) {
      loan.status = 'paid';
    }
    await this.loanRepo.save(loan);

    return this.repaymentRepo.save(repayment);
  }

  async getBorrowerLoans(borrowerId: string, borrowerType: string): Promise<LoanEntity[]> {
    return this.loanRepo.find({
      where: { borrowerId, borrowerType },
      order: { createdAt: 'DESC' },
    });
  }

  async getAdminLoans(status?: string): Promise<LoanEntity[]> {
    const where = status && status !== 'all' ? { status } : {};
    return this.loanRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getLoanStats(): Promise<{
    pending: number;
    approved: number;
    active: number;
    paid: number;
    totalDisbursed: number;
    outstanding: number;
  }> {
    const [pending, approved, active, paid, activeLoans] = await Promise.all([
      this.loanRepo.count({ where: { status: 'pending' } }),
      this.loanRepo.count({ where: { status: 'approved' } }),
      this.loanRepo.count({ where: { status: 'active' } }),
      this.loanRepo.count({ where: { status: 'paid' } }),
      this.loanRepo.find({ where: { status: 'active' } }),
    ]);

    const totalDisbursed = Math.round(
      activeLoans.reduce((sum, l) => sum + l.principal, 0) * 100,
    ) / 100;
    const outstanding = Math.round(
      activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0) * 100,
    ) / 100;

    return { pending, approved, active, paid, totalDisbursed, outstanding };
  }

  async getLoanRepayments(loanId: string, borrowerId?: string): Promise<LoanRepaymentEntity[]> {
    await this.getOwnedLoan(loanId, borrowerId);
    return this.repaymentRepo.find({
      where: { loanId },
      order: { paidAt: 'DESC' },
    });
  }

  async getLoanSchedule(loanId: string, borrowerId?: string) {
    const loan = await this.getOwnedLoan(loanId, borrowerId);

    const schedule = [];
    let balance = loan.principal;
    const monthlyRate = loan.interestRate / 12;

    for (let i = 1; i <= loan.termMonths; i++) {
      const interest = Math.round(balance * monthlyRate * 100) / 100;
      const principal = Math.round((loan.monthlyPayment - interest) * 100) / 100;
      balance = Math.round((balance - principal) * 100) / 100;

      const dueDate = new Date(loan.disbursedAt || new Date());
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        month: i,
        payment: loan.monthlyPayment,
        principal,
        interest,
        balance: Math.max(balance, 0),
        dueDate,
      });
    }

    return schedule;
  }
}
