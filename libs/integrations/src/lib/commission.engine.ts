import { Money } from '@afri-market/kernel';

export interface CommissionSplit {
  itemsSubtotal: Money;
  systemCommission: Money;
  vendorNet: Money;
  deliveryFee: Money;
  driverNet: Money;
  totalPaid: Money;
}

export class CommissionEngine {
  public static calculate(params: {
    items: Array<{ unitPrice: number; quantity: number }>;
    vendorCommissionRate: number;
    deliveryFee: number;
    currency?: string;
  }): CommissionSplit {
    const currency = params.currency ?? 'TZS';
    const itemsSubtotal = Money.create(
      params.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      currency,
    );
    const systemCommission = itemsSubtotal.percentage(params.vendorCommissionRate);
    const vendorNet = itemsSubtotal.subtract(systemCommission);
    const deliveryFee = Money.create(params.deliveryFee, currency);
    const totalPaid = itemsSubtotal.add(deliveryFee);

    return {
      itemsSubtotal,
      systemCommission,
      vendorNet,
      deliveryFee,
      driverNet: deliveryFee,
      totalPaid,
    };
  }
}
