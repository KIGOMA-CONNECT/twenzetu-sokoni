import { Logger } from '@nestjs/common';
import { StaleOrderService } from './stale-order.service';
import { OtpCleanupService } from './otp-cleanup.service';
import { SurgeRecalcService } from './surge-recalc.service';
import { LoanReminderService } from './loan-reminder.service';
import { PayoutSettlementService } from './payout-settlement.service';
import { CommissionSweepService } from './commission-sweep.service';
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
  let mockDataSource: { query: jest.Mock; getRepository: jest.Mock };
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
      getRepository: jest.fn().mockReturnValue(createMockRepo()),
    } as unknown as { query: jest.Mock; getRepository: jest.Mock };
    service = new StaleOrderService(mockDataSource as unknown as DataSource);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should cancel PLACED orders older than 24h via a guarded bulk UPDATE', async () => {
    mockDataSource.query.mockResolvedValue([{ id: 'order-1' }, { id: 'order-2' }]);

    await service.handleStaleOrders();

    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE orders SET status = \'CANCELLED\''),
      expect.arrayContaining([expect.any(Date)]),
    );
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE status = \'PLACED\' AND created_at < $1'),
      expect.anything(),
    );
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('RETURNING id'),
      expect.anything(),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Auto-cancelled 2 stale order(s)'));
  });

  it('should not log when no stale orders found', async () => {
    mockDataSource.query.mockResolvedValue([]);

    await service.handleStaleOrders();

    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Auto-cancelled'));
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
  let dataSource: { query: jest.Mock };
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = {
      query: jest.fn().mockResolvedValue([]),
    } as unknown as { query: jest.Mock };
    service = new LoanReminderService(dataSource as unknown as DataSource);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should log reminders for loans due within 3 days', async () => {
    const dueLoans = [
      { id: 'loan-1', borrower_id: 'borrower-1', due_date: new Date(), remaining_balance: 5000 },
      { id: 'loan-2', borrower_id: 'borrower-2', due_date: new Date(), remaining_balance: 10000 },
    ];
    dataSource.query.mockResolvedValueOnce(dueLoans);

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
    dataSource.query.mockResolvedValueOnce([]);

    await service.handleLoanReminders();

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should query loans table with correct conditions', async () => {
    await service.handleLoanReminders();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM loans'),
      expect.anything(),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'active'"),
      expect.anything(),
    );
  });
});

describe('PayoutSettlementService', () => {
  let service: PayoutSettlementService;
  let dataSource: { query: jest.Mock; transaction: jest.Mock };
  let managerQuery: jest.Mock;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    managerQuery = jest.fn().mockResolvedValue([{ id: 'tx-1' }]);
    dataSource = {
      query: jest.fn().mockResolvedValue([]),
      transaction: jest.fn().mockImplementation(async (cb: (manager: { query: jest.Mock }) => Promise<unknown>) => cb({ query: managerQuery })),
    } as unknown as { query: jest.Mock; transaction: jest.Mock };
    service = new PayoutSettlementService(dataSource as unknown as DataSource);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should log wallets with positive balance', async () => {
    dataSource.query.mockResolvedValue([
      { id: 'w1', tenant_id: 't1', owner_id: 'v1', owner_type: 'vendor', balance: 15000 },
      { id: 'w2', tenant_id: 't1', owner_id: 'v2', owner_type: 'vendor', balance: 7500 },
    ]);

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

  it('should not log settlement lines when no wallets with positive balance', async () => {
    await service.handlePayoutSettlement();

    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Settled'));
  });

  it('should query only vendor and driver earning wallets with balance > 0', async () => {
    await service.handlePayoutSettlement();

    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('w.balance > 0'));
    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('u.role'));
    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('role = \'driver\''));
  });

  it('should record settlement audit withdrawals and transactions', async () => {
    dataSource.query.mockResolvedValue([
      { id: 'w1', tenant_id: 't1', owner_id: 'v1', owner_type: 'vendor', balance: 5000 },
    ]);

    await service.handlePayoutSettlement();

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(managerQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE wallets SET balance = 0'),
      ['w1'],
    );
    expect(managerQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO wallet_withdrawals'),
      ['t1', 'v1', 5000],
    );
    expect(managerQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO wallet_transactions'),
      ['v1', 'vendor', 5000, 't1'],
    );
  });
});

describe('CommissionSweepService', () => {
  let service: CommissionSweepService;
  let dataSource: { query: jest.Mock };
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = {
      query: jest.fn().mockResolvedValue([]),
    } as unknown as { query: jest.Mock };
    service = new CommissionSweepService(dataSource as unknown as DataSource);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => logSpy.mockRestore());

  it('should write commission logs for released payments without an existing log', async () => {
    dataSource.query.mockResolvedValue([
      {
        id: 'p1',
        tenant_id: 't1',
        order_id: 'o1',
        vendor_id: 'v1',
        system_commission: '1000',
        vendor_net: '9000',
        confirmed_at: new Date('2026-01-02T00:00:00.000Z'),
        updated_at: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    await service.handleCommissionSweep();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("p.status = 'RELEASED'"),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('NOT EXISTS'),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO commission_logs'),
      ['t1', 'o1', 'v1', 10000, 0.1, 1000, expect.any(Date)],
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Commission logged: vendor v1 - Tsh 1000 from order o1'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Commission sweep complete: 1 commission record(s) written'),
    );
  });

  it('should skip rows with zero order amount', async () => {
    dataSource.query.mockResolvedValue([
      {
        id: 'p1',
        tenant_id: 't1',
        order_id: 'o1',
        vendor_id: 'v1',
        system_commission: '1000',
        vendor_net: '-1000',
        confirmed_at: null,
        updated_at: new Date(),
      },
    ]);

    await service.handleCommissionSweep();

    expect(dataSource.query).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Commission logged'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Commission sweep complete: 0 commission record(s) written'),
    );
  });

  it('should query only released payments with commission and no existing log', async () => {
    await service.handleCommissionSweep();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE p.status = 'RELEASED'"),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('p.system_commission > 0'),
    );
  });

  it('should not log when no released payments are pending', async () => {
    await service.handleCommissionSweep();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No released payments awaiting commission logging'));
  });
});
