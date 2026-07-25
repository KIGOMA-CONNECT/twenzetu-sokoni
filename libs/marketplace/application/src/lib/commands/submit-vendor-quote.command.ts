import { CommandBase } from '@afri-market/kernel';

export class SubmitVendorQuoteCommand extends CommandBase {
  constructor(
    public readonly procurementId: string,
    public readonly vendorId: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly itemCondition: string,
    public readonly warrantyPeriodDays: number,
  ) {
    super();
  }
}
