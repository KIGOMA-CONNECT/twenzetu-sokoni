import { CommandBase } from '@afri-market/kernel';

export class SubmitServiceQuoteCommand extends CommandBase {
  constructor(
    public readonly requestId: string,
    public readonly vendorId: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly message: string | undefined,
  ) {
    super();
  }
}
