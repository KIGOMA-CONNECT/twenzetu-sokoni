import { OrderNotifierService } from './order-notifier.service';

describe('OrderNotifierService', () => {
  let service: OrderNotifierService;
  const ds = { query: jest.fn() };
  const sms = {
    sendOrderStatusUpdate: jest.fn(),
    sendVendorCredited: jest.fn(),
    sendVendorNewOrder: jest.fn(),
  };
  const router = {
    route: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderNotifierService(ds as never, sms as never, router as never);
  });

  describe('notifyCustomerStatusChanged', () => {
    it('routes the notification with an SMS when the customer has a phone', async () => {
      ds.query.mockResolvedValue([{ customerId: 'cust-1', phoneNumber: '+255754100003' }]);

      await service.notifyCustomerStatusChanged({ tenantId: 'tenant-1', orderId: 'order-1', newStatus: 'CONFIRMED' });

      expect(router.route).toHaveBeenCalledTimes(1);
      const params = router.route.mock.calls[0][0];
      expect(params.userId).toBe('cust-1');
      expect(params.type).toBe('order_update');
      expect(params.sms).not.toBeNull();
      params.sms.send();
      expect(sms.sendOrderStatusUpdate).toHaveBeenCalledWith('+255754100003', 'order-1', 'CONFIRMED');
    });

    it('routes without SMS when the customer has no phone', async () => {
      ds.query.mockResolvedValue([{ customerId: 'cust-1', phoneNumber: null }]);

      await service.notifyCustomerStatusChanged({ tenantId: 'tenant-1', orderId: 'order-1', newStatus: 'CONFIRMED' });

      expect(router.route).toHaveBeenCalledWith(expect.objectContaining({ sms: null }));
    });

    it('does nothing when the order has no customer row', async () => {
      ds.query.mockResolvedValue([]);

      await service.notifyCustomerStatusChanged({ tenantId: 'tenant-1', orderId: 'order-1', newStatus: 'CONFIRMED' });

      expect(router.route).not.toHaveBeenCalled();
    });

    it('never throws when the query fails', async () => {
      ds.query.mockRejectedValue(new Error('db down'));

      await expect(
        service.notifyCustomerStatusChanged({ tenantId: 'tenant-1', orderId: 'order-1', newStatus: 'CONFIRMED' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyOrderReady', () => {
    it('routes the ready notification with a READY SMS for the customer', async () => {
      ds.query.mockResolvedValue([{ customerId: 'cust-1', phoneNumber: '+255754100003' }]);

      await service.notifyOrderReady({ tenantId: 'tenant-1', orderId: 'order-1' });

      expect(router.route).toHaveBeenCalledTimes(1);
      const params = router.route.mock.calls[0][0];
      expect(params.userId).toBe('cust-1');
      expect(params.type).toBe('order_ready');
      expect(params.sms).not.toBeNull();
      params.sms.send();
      expect(sms.sendOrderStatusUpdate).toHaveBeenCalledWith('+255754100003', 'order-1', 'READY');
    });

    it('does nothing when the order has no customer row', async () => {
      ds.query.mockResolvedValue([]);

      await service.notifyOrderReady({ tenantId: 'tenant-1', orderId: 'order-1' });

      expect(router.route).not.toHaveBeenCalled();
    });

    it('never throws when the query fails', async () => {
      ds.query.mockRejectedValue(new Error('db down'));

      await expect(
        service.notifyOrderReady({ tenantId: 'tenant-1', orderId: 'order-1' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyUserActionNeed', () => {
    it('routes the action-needed notification with an SMS for the vendor', async () => {
      ds.query.mockResolvedValue([{ vendorUserId: 'vendor-1', phoneNumber: '+255754100002' }]);

      await service.notifyUserActionNeed({ tenantId: 'tenant-1', orderId: 'order-1', total: 45000, currency: 'TZS' });

      expect(router.route).toHaveBeenCalledTimes(1);
      const params = router.route.mock.calls[0][0];
      expect(params.userId).toBe('vendor-1');
      expect(params.type).toBe('vendor_action_needed');
      expect(params.sms).not.toBeNull();
      params.sms.send();
      expect(sms.sendVendorNewOrder).toHaveBeenCalledWith('+255754100002', 'order-1', 45000, 'TZS');
    });

    it('routes without SMS when the vendor has no phone', async () => {
      ds.query.mockResolvedValue([{ vendorUserId: 'vendor-1', phoneNumber: null }]);

      await service.notifyUserActionNeed({ tenantId: 'tenant-1', orderId: 'order-1', total: 45000, currency: 'TZS' });

      expect(router.route).toHaveBeenCalledWith(expect.objectContaining({ sms: null }));
    });

    it('does nothing when the order has no vendor row', async () => {
      ds.query.mockResolvedValue([]);

      await service.notifyUserActionNeed({ tenantId: 'tenant-1', orderId: 'order-1', total: 45000, currency: 'TZS' });

      expect(router.route).not.toHaveBeenCalled();
    });

    it('never throws when the query fails', async () => {
      ds.query.mockRejectedValue(new Error('db down'));

      await expect(
        service.notifyUserActionNeed({ tenantId: 'tenant-1', orderId: 'order-1', total: 45000, currency: 'TZS' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyVendorPaid', () => {
    it('routes the payment notification with an SMS for the vendor', async () => {
      ds.query
        .mockResolvedValueOnce([{ vendorUserId: 'vendor-1' }])
        .mockResolvedValueOnce([{ phoneNumber: '+255754100002' }]);

      await service.notifyVendorPaid({ tenantId: 'tenant-1', orderId: 'order-1', amount: 12000, currency: 'TZS' });

      expect(router.route).toHaveBeenCalledTimes(1);
      const params = router.route.mock.calls[0][0];
      expect(params.userId).toBe('vendor-1');
      expect(params.type).toBe('payment_released');
      expect(params.sms).not.toBeNull();
      params.sms.send();
      expect(sms.sendVendorCredited).toHaveBeenCalledWith('+255754100002', 'order-1', 12000, 'TZS');
    });

    it('does nothing when the payment has no vendor', async () => {
      ds.query.mockResolvedValueOnce([]);

      await service.notifyVendorPaid({ tenantId: 'tenant-1', orderId: 'order-1', amount: 12000, currency: 'TZS' });

      expect(router.route).not.toHaveBeenCalled();
    });

    it('never throws when the query fails', async () => {
      ds.query.mockRejectedValue(new Error('db down'));

      await expect(
        service.notifyVendorPaid({ tenantId: 'tenant-1', orderId: 'order-1', amount: 12000, currency: 'TZS' }),
      ).resolves.toBeUndefined();
    });
  });
});
