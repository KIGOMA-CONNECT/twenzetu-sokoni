import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditLoggerService } from './audit-logger.service';

describe('AuditLoggerService', () => {
  let service: AuditLoggerService;
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLoggerService],
    }).compile();

    service = module.get<AuditLoggerService>(AuditLoggerService);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call logger.log with JSON string containing the entry fields', () => {
    const entry = {
      action: 'ORDER_CREATED',
      actorId: 'user-1',
      actorRole: 'buyer',
      tenantId: 'tenant-1',
      targetType: 'Order',
      targetId: 'order-123',
    };

    service.log(entry);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const loggedString = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(loggedString);
    expect(parsed.action).toBe('ORDER_CREATED');
    expect(parsed.actorId).toBe('user-1');
    expect(parsed.actorRole).toBe('buyer');
    expect(parsed.tenantId).toBe('tenant-1');
    expect(parsed.targetType).toBe('Order');
    expect(parsed.targetId).toBe('order-123');
  });

  it('should add timestamp to the logged entry', () => {
    const entry = {
      action: 'PAYMENT_RELEASED',
      actorId: 'admin-1',
      actorRole: 'admin',
      tenantId: 'tenant-2',
    };

    const before = new Date().toISOString();
    service.log(entry);
    const after = new Date().toISOString();

    const loggedString = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(loggedString);
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.timestamp >= before).toBe(true);
    expect(parsed.timestamp <= after).toBe(true);
  });

  it('should include metadata when provided', () => {
    const entry = {
      action: 'KYC_APPROVED',
      actorId: 'reviewer-1',
      actorRole: 'reviewer',
      tenantId: 'tenant-3',
      metadata: { documentType: 'passport', reason: 'Verified' },
    };

    service.log(entry);

    const loggedString = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(loggedString);
    expect(parsed.metadata).toEqual({ documentType: 'passport', reason: 'Verified' });
  });
});
