import { CommandBase } from '@afri-market/kernel';
import { CreateProductCommand } from './create-product.command';

export class BulkCreateProductsCommand extends CommandBase {
  constructor(
    public readonly vendorId: string,
    public readonly products: CreateProductCommand[],
  ) {
    super();
  }
}
