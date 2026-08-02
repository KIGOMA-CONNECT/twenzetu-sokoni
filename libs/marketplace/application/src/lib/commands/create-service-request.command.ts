import { CommandBase } from '@afri-market/kernel';

export class CreateServiceRequestCommand extends CommandBase {
  constructor(
    public readonly customerId: string,
    public readonly vendorId: string,
    public readonly listingId: string | undefined,
    public readonly title: string,
    public readonly quantity: number,
    public readonly unitLabel: string,
    public readonly details: string,
    public readonly photoUrls: string[],
    public readonly currency: string,
    public readonly scheduledAt?: Date,
  ) {
    super();
  }
}
