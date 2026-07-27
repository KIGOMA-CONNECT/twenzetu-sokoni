import { UssdSession, UssdResponse } from '../ussd.types';

export async function vendorMainMenu(
  session: UssdSession,
): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'Welcome to afriMarket Vendor',
      '',
      '1. View Orders',
      '2. Update Order Status',
      '3. My Products',
      '4. My Sales',
      '5. My Wallet',
      '0. Exit',
    ].join('\n'),
    continueSession: true,
  };
}

export async function handleVendorMenu(
  session: UssdSession,
  input: string,
): Promise<UssdResponse> {
  if (input === '0' || input === '') {
    return {
      sessionId: session.sessionId,
      message: 'Thank you for using afriMarket Vendor. Kwaheri!',
      continueSession: false,
    };
  }

  switch (input) {
    case '1':
      session.currentMenu = 'vendor:orders';
      return vendorOrders(session);
    case '2':
      session.currentMenu = 'vendor:update-status';
      return vendorUpdateStatus(session);
    case '3':
      session.currentMenu = 'vendor:products';
      return vendorProducts(session);
    case '4':
      session.currentMenu = 'vendor:sales';
      return vendorSales(session);
    case '5':
      session.currentMenu = 'vendor:wallet';
      return vendorWallet(session);
    default:
      return {
        sessionId: session.sessionId,
        message: 'Invalid option. Please try again.',
        continueSession: true,
      };
  }
}

async function vendorOrders(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'Pending Orders:',
      '',
      '(Loading orders...)',
      '',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function vendorUpdateStatus(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'Select order to update:',
      '',
      '(Loading orders...)',
      '',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function vendorProducts(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'My Products:',
      '',
      '(Loading products...)',
      '',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function vendorSales(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'Sales Summary:',
      '',
      '(Loading sales...)',
      '',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}

async function vendorWallet(session: UssdSession): Promise<UssdResponse> {
  return {
    sessionId: session.sessionId,
    message: [
      'My Wallet:',
      '',
      '1. Check Balance',
      '2. Withdraw to M-Pesa',
      '3. Withdraw to Bank',
      '4. Transaction History',
      '0. Back',
    ].join('\n'),
    continueSession: true,
  };
}
