import { CommandBase } from '@afri-market/kernel';

export class CreateReviewCommand extends CommandBase {
  constructor(
    public readonly customerId: string,
    public readonly vendorId: string,
    public readonly orderId: string,
    public readonly rating: number,
    public readonly comment: string | undefined,
  ) {
    super();
  }
}
