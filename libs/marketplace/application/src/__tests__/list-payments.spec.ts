import { ListPaymentsUseCase } from '../lib/use-cases/payment/list-payments.use-case';
import { GetPaymentByOrderUseCase } from '../lib/use-cases/payment/get-payment-by-order.use-case';

describe('ListPaymentsUseCase', () => {
  let useCase: ListPaymentsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      search: jest.fn(),
    };
    useCase = new ListPaymentsUseCase(mockRepo);
  });

  it('should return empty when no payments', async () => {
    mockRepo.search.mockResolvedValue({ data: [], total: 0 });
    const result = await useCase.execute('t-1', {});
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should pass filters to repo', async () => {
    mockRepo.search.mockResolvedValue({ data: [], total: 0 });
    await useCase.execute('t-1', { orderId: 'o-1', status: 'COMPLETED', limit: 10 });
    expect(mockRepo.search).toHaveBeenCalledWith('t-1', { orderId: 'o-1', status: 'COMPLETED', limit: 10 });
  });
});

describe('GetPaymentByOrderUseCase', () => {
  let useCase: GetPaymentByOrderUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findByOrderId: jest.fn(),
    };
    useCase = new GetPaymentByOrderUseCase(mockRepo);
  });

  it('should throw when no payment found', async () => {
    mockRepo.findByOrderId.mockResolvedValue(null);
    await expect(useCase.execute('t-1', 'order-1')).rejects.toThrow('Payment not found');
  });
});
