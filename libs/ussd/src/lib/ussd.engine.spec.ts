import { UssdEngine } from './ussd.engine';
import { UssdSession } from './ussd.types';

function makeSession(overrides: Partial<UssdSession> = {}): UssdSession {
  return {
    sessionId: 'sess-1',
    phoneNumber: '+255754100003',
    tenantId: 'a0000000-0000-0000-0000-000000000002',
    currentMenu: 'main',
    data: {},
    cart: [],
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    ...overrides,
  };
}

describe('UssdEngine', () => {
  let engine: UssdEngine;

  beforeEach(() => {
    engine = new UssdEngine();
  });

  describe('getMainMenu', () => {
    it('returns the customer main menu and resets session state', async () => {
      const session = makeSession({ userRole: 'customer' });
      const response = await engine.getMainMenu(session);

      expect(response.continueSession).toBe(true);
      expect(response.message).toContain('Welcome to afriMarket');
      expect(response.message).toContain('1. Shop');
      expect(session.currentMenu).toBe('main');
      expect(session.cart).toEqual([]);
    });

    it('returns the vendor main menu for vendor roles', async () => {
      const session = makeSession({ userRole: 'vendor' });
      const response = await engine.getMainMenu(session);

      expect(response.message).toContain('Welcome to afriMarket Vendor');
      expect(response.message).toContain('1. View Orders');
    });
  });

  describe('customer menu navigation', () => {
    it('navigates from main menu to shop categories', async () => {
      const session = makeSession();
      const response = await engine.processInput(session, '1');

      expect(session.currentMenu).toBe('shop:categories');
      expect(response.message).toContain('Select Category:');
    });

    it('navigates to orders and wallet menus', async () => {
      const session = makeSession();
      const orders = await engine.processInput(session, '2');
      expect(session.currentMenu).toBe('orders:list');
      expect(orders.message).toContain('My Orders:');

      const wallet = await engine.processInput(makeSession(), '3');
      expect(wallet.message).toContain('My Wallet:');
    });

    it('returns the main menu on back', async () => {
      const session = makeSession({ currentMenu: 'shop:categories' });
      const response = await engine.processInput(session, '0');

      expect(session.currentMenu).toBe('main');
      expect(response.message).toContain('Welcome to afriMarket');
    });

    it('rejects an invalid option', async () => {
      const response = await engine.processInput(makeSession(), '9');

      expect(response.message).toBe('Invalid option. Please try again.');
      expect(response.continueSession).toBe(true);
    });

    it('walks a full shop-to-checkout flow', async () => {
      const session = makeSession();

      await engine.processInput(session, '1');
      const products = await engine.processInput(session, '1');
      expect(products.message).toContain('Wali Wa Nazi');

      const detail = await engine.processInput(session, '1');
      expect(detail.message).toContain('Add to Cart');

      await engine.processInput(session, '1');
      const cart = await engine.processInput(session, '3');
      expect(cart.message).toContain('Cart total: TZS 12,000');
      expect(session.cart).toHaveLength(1);

      const checkout = await engine.processInput(session, '2');
      expect(checkout.message).toContain('Order placed successfully!');
      expect(session.cart).toHaveLength(0);
    });
  });

  describe('vendor menu navigation', () => {
    it('navigates the vendor main menu', async () => {
      const session = makeSession({ userRole: 'vendor' });
      const response = await engine.processInput(session, '1');

      expect(session.currentMenu).toBe('vendor:orders');
      expect(response.message).toContain('Pending Orders:');
    });

    it('opens the vendor wallet submenu', async () => {
      const session = makeSession({ userRole: 'vendor' });
      await engine.processInput(session, '5');

      expect(session.currentMenu).toBe('vendor:wallet');
      const response = await engine.processInput(session, '1');
      expect(response.message).toContain('Welcome to afriMarket Vendor');
    });
  });
});
