import { EntityId } from '@afri-market/kernel';
import { Notification } from './notification.aggregate';

describe('Notification.create', () => {
  it('creates a notification with PENDING status', () => {
    const notification = Notification.create({
      tenantId: 'tenant-1',
      userId: 'user-1',
      channel: 'EMAIL',
      title: 'Welcome',
      body: 'Welcome to ABMS!',
    });

    expect(notification.tenantId).toBe('tenant-1');
    expect(notification.userId).toBe('user-1');
    expect(notification.channel).toBe('EMAIL');
    expect(notification.title).toBe('Welcome');
    expect(notification.body).toBe('Welcome to ABMS!');
    expect(notification.priority).toBe('NORMAL');
    expect(notification.status).toBe('PENDING');
    expect(notification.data).toEqual({});
    expect(notification.templateId).toBeUndefined();
    expect(notification.sentAt).toBeUndefined();
    expect(notification.readAt).toBeUndefined();
  });

  it('accepts optional properties', () => {
    const notification = Notification.create({
      tenantId: 'tenant-1',
      userId: 'user-1',
      channel: 'PUSH',
      title: 'Alert',
      body: 'New order received',
      priority: 'HIGH',
      data: { orderId: 'order-123' },
      templateId: 'tpl-1',
      templateVariables: { name: 'John' },
    });

    expect(notification.priority).toBe('HIGH');
    expect(notification.data).toEqual({ orderId: 'order-123' });
    expect(notification.templateId).toBe('tpl-1');
    expect(notification.templateVariables).toEqual({ name: 'John' });
  });

  it('rejects empty tenantId', () => {
    expect(() =>
      Notification.create({
        tenantId: '',
        userId: 'u',
        channel: 'EMAIL',
        title: 't',
        body: 'b',
      })
    ).toThrow();
  });

  it('rejects empty userId', () => {
    expect(() =>
      Notification.create({
        tenantId: 't',
        userId: '',
        channel: 'EMAIL',
        title: 't',
        body: 'b',
      })
    ).toThrow();
  });

  it('rejects empty title', () => {
    expect(() =>
      Notification.create({
        tenantId: 't',
        userId: 'u',
        channel: 'EMAIL',
        title: '',
        body: 'b',
      })
    ).toThrow();
  });

  it('rejects empty body', () => {
    expect(() =>
      Notification.create({
        tenantId: 't',
        userId: 'u',
        channel: 'EMAIL',
        title: 't',
        body: '',
      })
    ).toThrow();
  });
});

describe('Notification mutators', () => {
  it('markSent() sets SENT status and sentAt', () => {
    const notification = Notification.create({
      tenantId: 't',
      userId: 'u',
      channel: 'EMAIL',
      title: 't',
      body: 'b',
    });

    notification.markSent();
    expect(notification.status).toBe('SENT');
    expect(notification.sentAt).toBeInstanceOf(Date);
  });

  it('markDelivered() sets DELIVERED status', () => {
    const notification = Notification.create({
      tenantId: 't',
      userId: 'u',
      channel: 'EMAIL',
      title: 't',
      body: 'b',
    });

    notification.markDelivered();
    expect(notification.status).toBe('DELIVERED');
  });

  it('markRead() sets READ status and readAt', () => {
    const notification = Notification.create({
      tenantId: 't',
      userId: 'u',
      channel: 'EMAIL',
      title: 't',
      body: 'b',
    });

    notification.markRead();
    expect(notification.status).toBe('READ');
    expect(notification.readAt).toBeInstanceOf(Date);
  });

  it('markFailed() sets FAILED status', () => {
    const notification = Notification.create({
      tenantId: 't',
      userId: 'u',
      channel: 'EMAIL',
      title: 't',
      body: 'b',
    });

    notification.markFailed();
    expect(notification.status).toBe('FAILED');
  });
});

describe('Notification.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const sentAt = new Date('2026-08-01T10:00:00Z');
    const readAt = new Date('2026-08-01T11:00:00Z');

    const notification = Notification.reconstitute({
      id,
      tenantId: 'tenant-1',
      userId: 'user-1',
      channel: 'EMAIL',
      title: 'Welcome',
      body: 'Hello',
      priority: 'HIGH',
      data: { key: 'val' },
      templateVariables: {},
      status: 'READ',
      sentAt,
      readAt,
    });

    expect(notification.id.equals(id)).toBe(true);
    expect(notification.status).toBe('READ');
    expect(notification.sentAt).toBe(sentAt);
    expect(notification.readAt).toBe(readAt);
  });
});
