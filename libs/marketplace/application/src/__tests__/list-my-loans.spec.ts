import { ListMyLoansUseCase } from '../lib/use-cases/finance/list-my-loans.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { MicroLoan } from '@afri-market/marketplace-domain';

describe('ListMyLoansUseCase', () => {
  let useCase: ListMyLoansUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findByBorrowerId: jest.fn(),
    };
    useCase = new ListMyLoansUseCase(mockRepo);
  });

  it('should return empty when no loans', async () => {
    mockRepo.findByBorrowerId.mockResolvedValue([]);
    const result = await useCase.execute('borrower-1');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should return loans for borrower', async () => {
    const loan = MicroLoan.create({
      id: EntityId.from('loan-1'),
      tenantId: TenantId.create('t-1'),
      borrowerId: EntityId.from('borrower-1'),
      borrowerType: 'vendor',
      loanType: 'WORKING_CAPITAL',
      requestedAmount: Money.create(100000),
      interestRate: 10,
      dailyRepaymentAmount: Money.create(3667),
      totalDays: 30,
    });
    mockRepo.findByBorrowerId.mockResolvedValue([loan]);
    const result = await useCase.execute('borrower-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].loanType).toBe('WORKING_CAPITAL');
    expect(result.data[0].requestedAmount).toBe(100000);
    expect(result.data[0].status).toBe('PENDING');
  });
});
