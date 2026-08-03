import { ICommand } from '@abms/kernel';

export class SuspendFleetOwnerCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly fleetOwnerId: string) {}
}
