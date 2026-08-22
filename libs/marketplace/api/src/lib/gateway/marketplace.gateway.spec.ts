import { MarketplaceGateway } from './marketplace.gateway';
import { sign } from 'jsonwebtoken';

const TEST_SECRET = 'test-secret';

function validToken(overrides: Record<string, unknown> = {}): string {
  return sign(
    { sub: 'u1', tenantId: 't1', role: 'customer', phoneNumber: '+255712345678', sid: 's1', tokenType: 'access', ...overrides },
    TEST_SECRET,
    { expiresIn: '1h' },
  );
}

describe('MarketplaceGateway', () => {
  let gateway: MarketplaceGateway;
  let mockServer: { to: jest.Mock; emit: jest.Mock };
  let mockClient: { id: string; join: jest.Mock; leave: jest.Mock; emit: jest.Mock; handshake: { auth: { token?: string } } };

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new MarketplaceGateway({ jwt: { secret: TEST_SECRET } } as never);
    mockServer = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    mockClient = {
      id: 'client-1',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      handshake: { auth: {} },
    };
    (gateway as unknown as { server: typeof mockServer }).server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should track connected client', () => {
      gateway.handleConnection(mockClient as never);
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('should authenticate and join rooms when a valid token is provided', () => {
      mockClient.handshake.auth.token = validToken();
      gateway.handleConnection(mockClient as never);
      expect(mockClient.join).toHaveBeenCalledWith('tenant:t1');
      expect(mockClient.join).toHaveBeenCalledWith('user:u1');
      expect(mockClient.emit).toHaveBeenCalledWith('authenticated', { success: true });
    });

    it('should not join rooms when an invalid token is provided', () => {
      mockClient.handshake.auth.token = 'not-a-token';
      gateway.handleConnection(mockClient as never);
      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).not.toHaveBeenCalledWith('authenticated', { success: true });
    });
  });

  describe('handleDisconnect', () => {
    it('should remove tracked client', () => {
      gateway.handleConnection(mockClient as never);
      gateway.handleDisconnect(mockClient as never);
    });
  });

  describe('handleAuthenticate', () => {
    it('should join tenant and user rooms and emit authenticated with a valid token', () => {
      gateway.handleConnection(mockClient as never);
      gateway.handleAuthenticate(mockClient as never, { token: validToken() });
      expect(mockClient.join).toHaveBeenCalledWith('tenant:t1');
      expect(mockClient.join).toHaveBeenCalledWith('user:u1');
      expect(mockClient.emit).toHaveBeenCalledWith('authenticated', { success: true });
    });

    it('should reject an invalid token', () => {
      gateway.handleConnection(mockClient as never);
      gateway.handleAuthenticate(mockClient as never, { token: 'garbage' });
      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('authenticated', { success: false, message: 'Invalid token' });
    });

    it('should reject a refresh token (wrong tokenType)', () => {
      gateway.handleConnection(mockClient as never);
      gateway.handleAuthenticate(mockClient as never, { token: validToken({ tokenType: 'refresh' }) });
      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('authenticated', { success: false, message: 'Invalid token' });
    });
  });

  describe('handleTrackOrder', () => {
    it('should join order room and emit tracking when authenticated', () => {
      gateway.handleConnection(mockClient as never);
      gateway.handleAuthenticate(mockClient as never, { token: validToken() });
      gateway.handleTrackOrder(mockClient as never, { orderId: 'o1' });
      expect(mockClient.join).toHaveBeenCalledWith('order:o1');
      expect(mockClient.emit).toHaveBeenCalledWith('tracking', { orderId: 'o1', tracking: true });
    });

    it('should reject tracking without authentication', () => {
      gateway.handleConnection(mockClient as never);
      gateway.handleTrackOrder(mockClient as never, { orderId: 'o1' });
      expect(mockClient.join).not.toHaveBeenCalledWith('order:o1');
      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Authentication required' });
    });
  });

  describe('handleUntrackOrder', () => {
    it('should leave order room and emit untracked', () => {
      gateway.handleConnection(mockClient as never);
      gateway.handleUntrackOrder(mockClient as never, { orderId: 'o1' });
      expect(mockClient.leave).toHaveBeenCalledWith('order:o1');
      expect(mockClient.emit).toHaveBeenCalledWith('untracked', { orderId: 'o1' });
    });
  });

  describe('notifyOrderUpdate', () => {
    it('should emit order-update to order room', () => {
      gateway.notifyOrderUpdate('o1', { status: 'DELIVERED' });
      expect(mockServer.to).toHaveBeenCalledWith('order:o1');
      expect(mockServer.emit).toHaveBeenCalledWith('order-update', { orderId: 'o1', status: 'DELIVERED' });
    });
  });

  describe('notifyDriverDelivery', () => {
    it('should emit delivery-update to driver user room', () => {
      gateway.notifyDriverDelivery('t1', 'd1', { deliveryId: 'dl-1' });
      expect(mockServer.to).toHaveBeenCalledWith('user:d1');
      expect(mockServer.emit).toHaveBeenCalledWith('delivery-update', { tenantId: 't1', deliveryId: 'dl-1' });
    });
  });

  describe('notifyPaymentConfirmed', () => {
    it('should emit payment-confirmed to user room', () => {
      gateway.notifyPaymentConfirmed('u1', { paymentId: 'p1', amount: 5000 });
      expect(mockServer.to).toHaveBeenCalledWith('user:u1');
      expect(mockServer.emit).toHaveBeenCalledWith('payment-confirmed', { paymentId: 'p1', amount: 5000 });
    });
  });

  describe('notifyDeliveryStatusChanged', () => {
    it('should emit to both order room and driver user room', () => {
      gateway.notifyDeliveryStatusChanged('o1', 'd1', { status: 'IN_TRANSIT' });
      expect(mockServer.to).toHaveBeenCalledWith('order:o1');
      expect(mockServer.emit).toHaveBeenCalledWith('delivery-status-changed', { status: 'IN_TRANSIT' });
      expect(mockServer.to).toHaveBeenCalledWith('user:d1');
    });
  });

  describe('notifyDisputeCreated', () => {
    it('should emit dispute-created to the customer and vendor user rooms, not the tenant room', () => {
      gateway.notifyDisputeCreated('t1', { disputeId: 'd-1' }, { customerId: 'c1', vendorId: 'v1' });
      expect(mockServer.to).toHaveBeenCalledWith('user:c1');
      expect(mockServer.to).toHaveBeenCalledWith('user:v1');
      expect(mockServer.to).not.toHaveBeenCalledWith('tenant:t1');
      expect(mockServer.emit).toHaveBeenCalledWith('dispute-created', { tenantId: 't1', disputeId: 'd-1' });
    });
  });

  describe('notifyNewOrder', () => {
    it('should emit new-order to vendor user room', () => {
      gateway.notifyNewOrder('v1', { orderId: 'o1' });
      expect(mockServer.to).toHaveBeenCalledWith('user:v1');
      expect(mockServer.emit).toHaveBeenCalledWith('new-order', { orderId: 'o1' });
    });
  });

  describe('notifyUser', () => {
    it('should emit arbitrary event to user room', () => {
      gateway.notifyUser('u1', 'custom-event', { foo: 'bar' });
      expect(mockServer.to).toHaveBeenCalledWith('user:u1');
      expect(mockServer.emit).toHaveBeenCalledWith('custom-event', { foo: 'bar' });
    });
  });

  describe('server null safety', () => {
    it('should not throw when server is undefined', () => {
      (gateway as unknown as { server: undefined }).server = undefined;
      expect(() => gateway.notifyOrderUpdate('o1', { status: 'x' })).not.toThrow();
      expect(() => gateway.notifyPaymentConfirmed('u1', { x: 1 })).not.toThrow();
      expect(() => gateway.notifyDisputeCreated('t1', { x: 1 }, { customerId: 'c1', vendorId: 'v1' })).not.toThrow();
      expect(() => gateway.notifyNewOrder('v1', { x: 1 })).not.toThrow();
    });
  });
});
