import { CommandBase } from '@afri-market/kernel';

export class CreateProductCommand extends CommandBase {
  constructor(
    public readonly vendorId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly type: string,
    public readonly categoryId: string,
    public readonly imageUrl: string | undefined,
    public readonly stockQuantity: number,
    public readonly unit: string,
    public readonly sku: string | undefined,
    public readonly barcode: string | undefined,
  ) {
    super();
  }
}
