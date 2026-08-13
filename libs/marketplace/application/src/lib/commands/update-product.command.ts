import { CommandBase } from '@afri-market/kernel';

export class UpdateProductCommand extends CommandBase {
  constructor(
    public readonly productId: string,
    public readonly updaterUserId: string,
    public readonly name: string | undefined,
    public readonly description: string | undefined,
    public readonly price: number | undefined,
    public readonly currency: string | undefined,
    public readonly type: string | undefined,
    public readonly categoryId: string | undefined,
    public readonly imageUrl: string | undefined,
    public readonly stockQuantity: number | undefined,
    public readonly unit: string | undefined,
    public readonly sku: string | undefined,
    public readonly barcode: string | undefined,
    public readonly status: string | undefined,
  ) {
    super();
  }
}
