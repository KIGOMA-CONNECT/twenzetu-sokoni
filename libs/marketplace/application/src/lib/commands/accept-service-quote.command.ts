import { CommandBase } from '@afri-market/kernel';

export class AcceptServiceQuoteCommand extends CommandBase {
  constructor(
    public readonly quoteId: string,
    public readonly customerId: string,
  ) {
    super();
  }
}
