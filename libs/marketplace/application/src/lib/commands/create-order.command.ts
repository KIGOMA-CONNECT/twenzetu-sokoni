import { CommandBase } from '@afri-market/kernel';

export class CreateOrderCommand extends CommandBase {
  constructor(
    public readonly customerId: string,
    public readonly vendorId: string,
    public readonly type: string,
    public readonly deliveryAddress: string,
    public readonly items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>,
    public readonly paymentMethod: string = 'mpesa',
    public readonly deliveryLatitude?: number,
    public readonly deliveryLongitude?: number,
    public readonly specialInstructions?: string,
    public readonly customerPhone?: string,
    public readonly customerEmail?: string,
    public readonly currency?: string,
  ) {
    super();
  }
}
