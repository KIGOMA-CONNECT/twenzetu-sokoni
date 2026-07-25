import { CommandBase } from '@afri-market/kernel';

export class CreateCustomProcurementCommand extends CommandBase {
  constructor(
    public readonly customerId: string,
    public readonly productQuery: string,
    public readonly specifications: Record<string, unknown> | undefined,
  ) {
    super();
  }
}
