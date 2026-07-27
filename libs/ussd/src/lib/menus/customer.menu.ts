import { UssdSession, UssdResponse } from '../ussd.types';
import { formatCurrency } from '../formatting';

export async function customerMainMenu(
  session: UssdSession,
): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'Welcome to afriMarket',
      '',
      '1. Shop',
      '2. My Orders',
      '3. My Wallet',
      '4. My Profile',
      '5. Help',
      '0. Exit',
    ].join('\n'),
    continueSession: true,
  };
}

export async function handleCustomerMenu(
  session: UssdSession,
  input: string,
): Promise<UssdResponse> {
  if (input === '0' || input === '') {
    return {
      sessionId: session.sessionId,
      message: 'Thank you for using afriMarket. Kwaheri!',
      continueSession: false,
    };
  }

  switch (input) {
    case '1':
      session.currentMenu = 'shop:categories';
      return shopCategories(session);
    case '2':
      session.currentMenu = 'orders:list';
      return ordersList(session);
    case '3':
      session.currentMenu = 'wallet:main';
      return walletMenu(session);
    case '4':
      session.currentMenu = 'profile:main';
      return profileMenu(session);
    case '5':
      session.currentMenu = 'help';
      return helpMenu(session);
    default:
      return invalidOption(session);
  }
}

async function shopCategories(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'Select Category:',
      '',
      '1. Fresh Produce',
      '2. Electronics',
      '3. General Goods',
      '4. Laundry Services',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function ordersList(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'My Orders:',
      '',
      '1. Active Orders',
      '2. Order History',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function walletMenu(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'My Wallet:',
      '',
      '1. Check Balance',
      '2. Top Up (M-Pesa)',
      '3. Top Up (Tigo Money)',
      '4. Top Up (Airtel Money)',
      '5. Transaction History',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function profileMenu(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'My Profile:',
      '',
      '1. View Profile',
      '2. Update Name',
      '3. Update Address',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function helpMenu(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'afriMarket Help:',
      '',
      'Dial *150*30# to access afriMarket.',
      '',
      'Shop: Browse and order products from local vendors.',
      'Orders: Track your order status.',
      'Wallet: Manage your afriMarket wallet.',
      '',
      'For support, call: +255754100001',
      '',
      '0. Back to Main Menu',
    ].join('\n'),
    continueSession: true,
  };
}

export function invalidOption(session: UssdSession): UssdResponse {
  return {
    sessionId: session.sessionId,
    message: 'Invalid option. Please try again.',
    continueSession: true,
  };
}
