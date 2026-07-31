import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AutoDispatchService } from './auto-dispatch.service';

function createMockDataSource() {
  return { query: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<DataSource>;
}

function createMocks() {
  return {
    notifService: { create: jest.fn().mockResolvedValue({}) },
    gateway: { notifyDriverDelivery: jest.fn() },
  };
}

const CANDIDATE = {
  id: 'order-1',
  tenantId: 't1',
  customerId: 'customer-1',
  vendorId: 'vendor-1',
  status: 'PLACED',
  deliveryAddress: 'Posta, Dar es Salaam',
  deliveryLatitude: null,
  deliveryLongitude: null,
  deliveryFee: '2000',
  totalAmount: '7000',
  vendorName: 'Dar Fresh Market',
};

const DRIVER = { driverId: 'driver-1', vehicleType: 'boda', plateNumber: 'T 123 ABC' };

describe('AutoDispatchService', () => {
  let dataSource: jest.Mocked<DataSource>;
  let service: AutoDispatchService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = createMockDataSource();
    const { notifService, gateway } = createMocks();
    service = new AutoDispatchService(dataSource as unknown as DataSource, notifService as never, gateway as never);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should return early when no candidates are eligible for dispatch', async () => {
    await service.handleDispatch();

    expect(dataSource.query).toHaveBeenCalledTimes(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN deliveries'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('eligible for dispatch'));
  });

  it('should dispatch each eligible order with delivery insert, order update, notification and socket emit', async () => {
    dataSource.query
      .mockResolvedValueOnce([CANDIDATE])
      .mockResolvedValueOnce([DRIVER])
      .mockResolvedValueOnce([{ id: 'delivery-1' }])
      .mockResolvedValueOnce([]);
    const { notifService, gateway } = createMocks();
    service = new AutoDispatchService(dataSource as unknown as DataSource, notifService as never, gateway as never);

    await service.handleDispatch();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO deliveries'),
      expect.anything(),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(`UPDATE orders SET status = 'READY_FOR_PICKUP'`),
      expect.anything(),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('is_online = true AND v.is_available = true'),
      expect.anything(),
    );
    expect(notifService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: DRIVER.driverId,
        type: 'delivery_assigned',
        referenceId: CANDIDATE.id,
      }),
    );
    expect(gateway.notifyDriverDelivery).toHaveBeenCalledWith(
      't1',
      DRIVER.driverId,
      { deliveryId: 'delivery-1', orderId: 'order-1', status: 'PENDING' },
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('order-1'));
  });

  it('should log a warning and skip the order when no driver is available', async () => {
    dataSource.query
      .mockResolvedValueOnce([CANDIDATE])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.handleDispatch();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no available driver for order order-1'));
    expect(dataSource.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO deliveries'),
      expect.anything(),
    );
  });

  it('should fall back to any available driver when no driver is online', async () => {
    dataSource.query
      .mockResolvedValueOnce([CANDIDATE])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([DRIVER])
      .mockResolvedValueOnce([{ id: 'delivery-1' }])
      .mockResolvedValueOnce([]);
    const { notifService, gateway } = createMocks();
    service = new AutoDispatchService(dataSource as unknown as DataSource, notifService as never, gateway as never);

    await service.handleDispatch();

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('v.is_available = true'),
      expect.anything(),
    );
    expect(notifService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: DRIVER.driverId }),
    );
    expect(gateway.notifyDriverDelivery).toHaveBeenCalledWith(
      't1',
      DRIVER.driverId,
      expect.objectContaining({ orderId: CANDIDATE.id }),
    );
  });

  it('should log the error and continue when a query fails', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection reset'));

    await service.handleDispatch();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('connection reset'));
  });
});
