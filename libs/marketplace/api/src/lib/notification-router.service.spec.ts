import { NotificationRouterService } from './notification-router.service';

describe('NotificationRouterService', () => {
  let router: NotificationRouterService;
  const notifService = {
    create: jest.fn(),
  };

  const baseParams = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    title: 'Order Update',
    message: 'Your order is now CONFIRMED.',
    type: 'order_update',
    referenceId: 'order-1',
    referenceType: 'order',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    router = new NotificationRouterService(notifService as never);
    notifService.create.mockResolvedValue({ id: 'n1' });
  });

  it('creates an in-app notification with push enabled by default', async () => {
    await router.route(baseParams);

    expect(notifService.create).toHaveBeenCalledWith({
      ...baseParams,
      push: true,
    });
  });

  it('disables push when requested', async () => {
    await router.route({ ...baseParams, push: false });

    expect(notifService.create).toHaveBeenCalledWith(expect.objectContaining({ push: false }));
  });

  it('skips the in-app channel when disabled', async () => {
    await router.route({ ...baseParams, inApp: false });

    expect(notifService.create).not.toHaveBeenCalled();
  });

  it('sends an SMS when a phone and sender are provided', async () => {
    const send = jest.fn().mockResolvedValue({ success: true });

    await router.route({ ...baseParams, sms: { phone: '+255754100003', send } });

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('skips SMS when no phone is provided', async () => {
    await router.route({ ...baseParams, sms: null });

    expect(notifService.create).toHaveBeenCalledTimes(1);
  });

  it('never throws when the in-app channel fails', async () => {
    notifService.create.mockRejectedValue(new Error('db down'));

    await expect(router.route(baseParams)).resolves.toBeUndefined();
  });

  it('never throws when the SMS channel fails', async () => {
    const send = jest.fn().mockRejectedValue(new Error('provider down'));

    await expect(router.route({ ...baseParams, sms: { phone: '+255754100003', send } }))
      .resolves.toBeUndefined();
  });
});
