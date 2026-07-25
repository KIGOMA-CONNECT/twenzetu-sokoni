import { Logger } from '@nestjs/common';
import { StaleOrderService } from './stale-order.service';
import { OtpCleanupService } from './otp-cleanup.service';
import { SurgeRecalcService } from './surge-recalc.service';
import { LoanReminderService } from './loan-reminder.service';
import { PayoutSettlementService } from './payout-settlement.service';
import { DataSource } from 'typeorm';

function createMockRepo() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
}

function createMockDataSource(repo: ReturnType<typeof createMockRepo>) {
  return { getRepository: jest.fn().mockReturnValue(repo) } as unknown as jest.Mocked<DataSource>;
}

describe('StaleOrderService', () => {
  let service: StaleOrderService;
  let mockRepo: ReturnType<typeof createMockRepo>;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepo();
    service = new StaleOrderService(createMockDataSource(mockRepo));
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should find PLACED orders older than 24h and update status to CANCELLED', async () => {
    const staleOrders = [
      { id: 'order-1', status: 'PLACED', createdAt: new Date('2020-01-01'), version: 1 },
      { id: 'order-2', status: 'PLACED', createdAt: new Date('2020-01-02'), version: 3 },
    ];
    mockRepo.find.mockResolvedValue(staleOrders);

    await service.handleStaleOrders();

    expect(mockRepo.find).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: 'PLACED' }),
    });
    expect(mockRepo.save).toHaveBeenCalledTimes(2);
    expect(staleOrders[0].status).toBe('CANCELLED');
    expect(staleOrders[0].version).toBe(2);
    expect(staleOrders[1].status).toBe('CANCELLED');
    expect(staleOrders[1].version).toBe(4);
  });

  it('should not call save when no stale orders found', async () => {
    mockRepo.find.mockResolvedValue([]);

    await service.handleStaleOrders();

    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});

describe('OtpCleanupService', () => {
  let service: OtpCleanupService;
  let mockRepo: ReturnType<typeof createMockRepo>;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepo();
    service = new OtpCleanupService(createMockDataSource(mockRepo));
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should delete OTP records older than 10 minutes', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 5 });

    await service.handleOtpCleanup();

    expect(mockRepo.delete).toHaveBeenCalledWith({
      createdAt: expect.objectContaining({ _type: 'lessThan' }),
    });
  });

  it('should log when OTP records are deleted', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 3 });

    await service.handleOtpCleanup();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('OTP cleanup complete: 3 expired OTP record(s) deleted'),
    );
  });

  it('should not log when no OTP records deleted', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 0 });

    await service.handleOtpCleanup();

    expect(logSpy).not.toHaveBeenCalled();
  });
});

describe('SurgeRecalcService', () => {
  let service: SurgeRecalcService;
  let mockRepo: ReturnType<typeof createMockRepo>;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepo();
    service = new SurgeRecalcService(createMockDataSource(mockRepo));
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should deactivate expired surge rules', async () => {
    const currentHour = new Date().getHours();
    const expiredRule = {
      id: 'rule-1',
      name: 'Rush Hour',
      isActive: true,
      endHour: currentHour - 1,
      version: 1,
    };
    mockRepo.find.mockResolvedValue([expiredRule]);

    await service.handleSurgeRecalc();

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(expiredRule.isActive).toBe(false);
    expect(expiredRule.version).toBe(2);
  });

  it('should not deactivate rules that have not expired', async () => {
    const currentHour = new Date().getHours();
    const activeRule = {
      id: 'rule-2',
      name: 'Active Surge',
      isActive: true,
      endHour: currentHour + 5,
      version: 1,
    };
    mockRepo.find.mockResolvedValue([activeRule]);

    await service.handleSurgeRecalc();

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(activeRule.isActive).toBe(true);
  });

  it('should skip rules with null endHour', async () => {
    const ruleNoEnd = {
      id: 'rule-3',
      name: 'Always On',
      isActive: true,
      endHour: null,
      version: 1,
    };
    mockRepo.find.mockResolvedValue([ruleNoEnd]);

    await service.handleSurgeRecalc();

    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});

describe('LoanReminderService', () => {
  let service: LoanReminderService;
  let mockRepo: ReturnType<typeof createMockRepo>;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepo();
    service = new LoanReminderService(createMockDataSource(mockRepo));
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should log reminders for loans due within 3 days', async () => {
    const dueLoans = [
      { id: 'loan-1', borrowerId: 'borrower-1', dueAt: new Date(), outstandingBalance: 5000, currency: 'TZS' },
      { id: 'loan-2', borrowerId: 'borrower-2', dueAt: new Date(), outstandingBalance: 10000, currency: 'TZS' },
    ];
    mockRepo.getMany.mockResolvedValue(dueLoans);

    await service.handleLoanReminders();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('loan-1'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('loan-2'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('2 loan(s) approaching due date'),
    );
  });

  it('should not log when no loans approaching due date', async () => {
    mockRepo.getMany.mockResolvedValue([]);

    await service.handleLoanReminders();

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should use query builder with correct conditions', async () => {
    await service.handleLoanReminders();

    expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('loan');
    expect(mockRepo.where).toHaveBeenCalledWith('loan.status = :status', { status: 'ACTIVE' });
    expect(mockRepo.getMany).toHaveBeenCalled();
  });
});

describe('PayoutSettlementService', () => {
  let service: PayoutSettlementService;
  let mockRepo: ReturnType<typeof createMockRepo>;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepo();
    service = new PayoutSettlementService(createMockDataSource(mockRepo));
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should log wallets with positive balance', async () => {
    const wallets = [
      { ownerType: 'vendor', ownerId: 'v1', balance: 15000, currency: 'TZS' },
      { ownerType: 'vendor', ownerId: 'v2', balance: 7500, currency: 'TZS' },
    ];
    mockRepo.find.mockResolvedValue(wallets);

    await service.handlePayoutSettlement();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('vendor v1'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('vendor v2'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('2 wallet(s), total 22500'),
    );
  });

  it('should not log when no wallets with positive balance', async () => {
    mockRepo.find.mockResolvedValue([]);

    await service.handlePayoutSettlement();

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should query wallets with balance > 0', async () => {
    mockRepo.find.mockResolvedValue([]);

    await service.handlePayoutSettlement();

    expect(mockRepo.find).toHaveBeenCalledWith({
      where: expect.objectContaining({ balance: expect.anything() }),
    });
  });
});
