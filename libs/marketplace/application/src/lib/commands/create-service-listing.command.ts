import { CommandBase } from '@afri-market/kernel';

export class CreateServiceListingCommand extends CommandBase {
  constructor(
    public readonly vendorId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly category: string,
    public readonly pricingModel: string,
    public readonly basePrice: number,
    public readonly currency: string,
    public readonly unitLabel: string | undefined,
    public readonly imageUrl: string | undefined,
  ) {
    super();
  }
}
