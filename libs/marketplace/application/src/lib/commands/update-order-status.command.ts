import { CommandBase } from '@afri-market/kernel';

export class UpdateOrderStatusCommand extends CommandBase {
  constructor(
    public readonly orderId: string,
    public readonly status: string,
  ) {
    super();
  }
}
