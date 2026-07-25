import { CommandBase } from '@afri-market/kernel';

export class CreateVendorCommand extends CommandBase {
  constructor(
    public readonly userId: string,
    public readonly shopName: string,
    public readonly description: string | undefined,
    public readonly category: string,
    public readonly commissionRate: number,
  ) {
    super();
  }
}
