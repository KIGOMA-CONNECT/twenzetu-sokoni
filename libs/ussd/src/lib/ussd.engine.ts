import { Injectable } from '@nestjs/common';
import { UssdSession, UssdResponse } from './ussd.types';
import { customerMainMenu, invalidOption } from './menus/customer.menu';
import { vendorMainMenu } from './menus/vendor.menu';
import { formatCurrency } from './formatting';

@Injectable()
export class UssdEngine {
  async processInput(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    if (input === '0') {
      return this.goBack(session);
    }

    const menu = session.currentMenu;
    const isVendor = session.userRole === 'vendor';

    if (menu === 'main') {
      return isVendor
        ? this.handleVendorMainMenu(session, input)
        : this.handleCustomerMainMenu(session, input);
    }

    if (menu === 'shop:categories') {
      return this.handleShopCategories(session, input);
    }
    if (menu === 'shop:products') {
      return this.handleShopProducts(session, input);
    }
    if (menu === 'shop:detail') {
      return this.handleShopDetail(session, input);
    }
    if (menu === 'shop:quantity') {
      return this.handleShopQuantity(session, input);
    }
    if (menu === 'shop:cart') {
      return this.handleShopCart(session, input);
    }
    if (menu === 'orders:list') {
      return this.handleOrdersList(session, input);
    }
    if (menu === 'wallet:main') {
      return this.handleWalletMenu(session, input);
    }
    if (menu === 'profile:main') {
      return this.handleProfileMenu(session, input);
    }
    if (menu === 'profile:view') {
      return this.handleProfileView(session, input);
    }

    if (menu.startsWith('vendor:')) {
      return this.handleVendorSubmenu(session, input);
    }

    if (menu === 'help') {
      session.currentMenu = 'main';
      return customerMainMenu(session);
    }

    return invalidOption(session);
  }

  async getMainMenu(session: UssdSession): Promise<UssdResponse> {
    session.currentMenu = 'main';
    session.data = {};
    session.cart = [];

    if (session.userRole === 'vendor') {
      return vendorMainMenu(session);
    }
    return customerMainMenu(session);
  }

  private async goBack(session: UssdSession): Promise<UssdResponse> {
    session.currentMenu = 'main';
    session.data = {};
    session.cart = [];
    if (session.userRole === 'vendor') {
      return vendorMainMenu(session);
    }
    return customerMainMenu(session);
  }

  private shopCategories(session: UssdSession): UssdResponse {
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

  private async handleCustomerMainMenu(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    switch (input) {
      case '1':
        session.currentMenu = 'shop:categories';
        return this.shopCategories(session);
      case '2':
        session.currentMenu = 'orders:list';
        return this.ordersList(session);
      case '3':
        session.currentMenu = 'wallet:main';
        return this.walletMenu(session);
      case '4':
        session.currentMenu = 'profile:main';
        return this.profileMenu(session);
      case '5':
        session.currentMenu = 'help';
        return this.helpMenu(session);
      default:
        return invalidOption(session);
    }
  }

  private async handleShopCategories(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    const categories: Record<string, string> = {
      '1': 'Fresh Produce',
      '2': 'Electronics',
      '3': 'General Goods',
      '4': 'Laundry Services',
    };
    const cat = categories[input];
    if (!cat) return invalidOption(session);

    session.currentMenu = 'shop:products';
    session.data.selectedCategory = cat;
    return {
      sessionId: session.sessionId,
      message: [
        `${cat}:`,
        '',
        '1. Wali Wa Nazi (Coconut Rice) - TZS 4,000',
        '2. Nyama Choma (1kg) - TZS 15,000',
        '3. Mchicha (Spinach Bundle) - TZS 1,000',
        '4. Samsung Galaxy A15 - TZS 450,000',
        '5. Phone Charger USB-C - TZS 8,000',
        '',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async handleShopProducts(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    const products: Record<string, { name: string; price: number; id: string; vendor: string }> = {
      '1': { name: 'Wali Wa Nazi (Coconut Rice)', price: 4000, id: 'e0000000-0000-0000-0000-000000000010', vendor: 'Dar Fresh Market' },
      '2': { name: 'Nyama Choma (1kg)', price: 15000, id: 'e0000000-0000-0000-0000-000000000011', vendor: 'Dar Fresh Market' },
      '3': { name: 'Mchicha (Spinach Bundle)', price: 1000, id: 'e0000000-0000-0000-0000-000000000012', vendor: 'Dar Fresh Market' },
      '4': { name: 'Samsung Galaxy A15', price: 450000, id: 'e0000000-0000-0000-0000-000000000013', vendor: 'Kariakoo Electronics' },
      '5': { name: 'Phone Charger USB-C', price: 8000, id: 'e0000000-0000-0000-0000-000000000014', vendor: 'Kariakoo Electronics' },
    };
    const product = products[input];
    if (!product) return invalidOption(session);

    session.currentMenu = 'shop:detail';
    session.data.selectedProduct = product;
    return {
      sessionId: session.sessionId,
      message: [
        `${product.name}`,
        `Price: ${formatCurrency(product.price)}`,
        `Vendor: ${product.vendor}`,
        '',
        '1. Add to Cart',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async handleShopDetail(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    if (input === '1') {
      session.currentMenu = 'shop:quantity';
      return {
        sessionId: session.sessionId,
        message: `Enter quantity for ${session.data.selectedProduct.name}:`,
        continueSession: true,
      };
    }
    return invalidOption(session);
  }

  private async handleShopQuantity(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    const qty = parseInt(input, 10);
    if (isNaN(qty) || qty < 1) {
      return {
        sessionId: session.sessionId,
        message: 'Please enter a valid quantity (1 or more):',
        continueSession: true,
      };
    }

    const product = session.data.selectedProduct;
    const item = {
      productId: product.id,
      productName: product.name,
      vendorId: product.id.substring(0, 36),
      vendorName: product.vendor,
      unitPrice: product.price,
      quantity: qty,
      currency: 'TZS',
    };

    session.cart.push(item);
    const total = session.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    session.currentMenu = 'shop:cart';
    return {
      sessionId: session.sessionId,
      message: [
        `Added ${qty}x ${product.name} to cart.`,
        '',
        `Cart total: ${formatCurrency(total)}`,
        `${session.cart.length} item(s) in cart`,
        '',
        '1. Continue Shopping',
        '2. Checkout',
        '0. Back to Main',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async handleShopCart(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    switch (input) {
      case '1':
        session.currentMenu = 'shop:categories';
        return this.shopCategories(session);
      case '2': {
        const total = session.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        const items = session.cart.map(i => `${i.quantity}x ${i.productName}`).join(', ');
        session.cart = [];
        session.currentMenu = 'main';
        return {
          sessionId: session.sessionId,
          message: [
            'Order placed successfully!',
            '',
            `Items: ${items}`,
            `Total: ${formatCurrency(total)}`,
            `Payment: Cash on Delivery`,
            '',
            'Press 0 to return to Main Menu.',
          ].join('\n'),
          continueSession: true,
        };
      }
      default:
        return invalidOption(session);
    }
  }

  private async ordersList(session: UssdSession): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: [
        'My Orders:',
        '',
        '1. Order #001 - DELIVERED - TZS 22,000',
        '2. Order #002 - CONFIRMED - TZS 455,000',
        '3. Order #003 - PLACED - TZS 7,000',
        '',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async handleOrdersList(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: 'Feature coming soon. Press 0 to go back.',
      continueSession: true,
    };
  }

  private async walletMenu(session: UssdSession): Promise<UssdResponse> {
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

  private async handleWalletMenu(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    if (input === '1') {
      return {
        sessionId: session.sessionId,
        message: [
          'Wallet Balance: TZS 50,000',
          '',
          '0. Back',
        ].join('\n'),
        continueSession: true,
      };
    }
    if (['2', '3', '4'].includes(input)) {
      const methods: Record<string, string> = { '2': 'M-Pesa', '3': 'Tigo Money', '4': 'Airtel Money' };
      return {
        sessionId: session.sessionId,
        message: [
          `Top Up via ${methods[input]}:`,
          '',
          'Enter amount in TZS:',
          '0. Back',
        ].join('\n'),
        continueSession: true,
      };
    }
    if (input === '5') {
      return {
        sessionId: session.sessionId,
        message: [
          'Transaction History:',
          '',
          '+ TZS 17,100 - Payment Release',
          '- TZS 5,000 - Order Payment',
          '',
          '0. Back',
        ].join('\n'),
        continueSession: true,
      };
    }
    return invalidOption(session);
  }

  private async profileMenu(session: UssdSession): Promise<UssdResponse> {
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

  private async handleProfileMenu(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    if (input === '1') {
      session.currentMenu = 'profile:view';
      return {
        sessionId: session.sessionId,
        message: [
          `Name: ${session.data.profileName || 'Hassan Customer'}`,
          `Phone: ${session.phoneNumber}`,
          `Address: ${session.data.profileAddress || 'Kariakoo, Dar es Salaam'}`,
          '',
          '0. Back',
        ].join('\n'),
        continueSession: true,
      };
    }
    return {
      sessionId: session.sessionId,
      message: 'Feature coming soon. Press 0 to go back.',
      continueSession: true,
    };
  }

  private async handleProfileView(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    session.currentMenu = 'profile:main';
    return this.profileMenu(session);
  }

  private async helpMenu(session: UssdSession): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: [
        'afriMarket Help:',
        '',
        'Dial *150*30# to access afriMarket.',
        '',
        'Shop: Browse and order products.',
        'Orders: Track your order status.',
        'Wallet: Manage your afriMarket wallet.',
        '',
        'For support: +255754100001',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async handleVendorMainMenu(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    switch (input) {
      case '1':
        session.currentMenu = 'vendor:orders';
        return this.vendorOrders(session);
      case '2':
        session.currentMenu = 'vendor:update-status';
        return this.vendorUpdateStatus(session);
      case '3':
        session.currentMenu = 'vendor:products';
        return this.vendorProducts(session);
      case '4':
        session.currentMenu = 'vendor:sales';
        return this.vendorSales(session);
      case '5':
        session.currentMenu = 'vendor:wallet';
        return this.vendorWallet(session);
      default:
        return invalidOption(session);
    }
  }

  private async handleVendorSubmenu(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    switch (session.currentMenu) {
      case 'vendor:orders':
      case 'vendor:update-status':
      case 'vendor:products':
      case 'vendor:sales': {
        session.currentMenu = 'main';
        return vendorMainMenu(session);
      }
      case 'vendor:wallet':
        return this.handleVendorWallet(session, input);
      default: {
        session.currentMenu = 'main';
        return vendorMainMenu(session);
      }
    }
  }

  private async vendorOrders(session: UssdSession): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: [
        'Pending Orders:',
        '',
        '1. Order #003 - Hassan - TZS 7,000',
        '   Status: PLACED',
        '',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async vendorUpdateStatus(session: UssdSession): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: [
        'Select order to update:',
        '',
        '1. Order #003 - PLACED',
        '   1a. Accept  1b. Reject',
        '',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async vendorProducts(session: UssdSession): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: [
        'My Products:',
        '',
        '1. Wali Wa Nazi - TZS 4,000 (80 in stock)',
        '2. Nyama Choma - TZS 15,000 (30 in stock)',
        '3. Mchicha - TZS 1,000 (150 in stock)',
        '',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async vendorSales(session: UssdSession): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: [
        'Sales Summary:',
        '',
        `Today: 2 orders - ${formatCurrency(22000)}`,
        `This Week: 2 orders - ${formatCurrency(22000)}`,
        `This Month: 2 orders - ${formatCurrency(22000)}`,
        '',
        `Net Earnings: ${formatCurrency(20100)}`,
        '',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async vendorWallet(session: UssdSession): Promise<UssdResponse> {
    return {
      sessionId: session.sessionId,
      message: [
        'My Wallet:',
        '',
        `Balance: ${formatCurrency(17100)}`,
        'Pending: TZS 0',
        '',
        '1. Withdraw to M-Pesa',
        '2. Withdraw to Bank',
        '3. Transaction History',
        '0. Back',
      ].join('\n'),
      continueSession: true,
    };
  }

  private async handleVendorWallet(
    session: UssdSession,
    _input: string,
  ): Promise<UssdResponse> {
    session.currentMenu = 'main';
    return vendorMainMenu(session);
  }
}
