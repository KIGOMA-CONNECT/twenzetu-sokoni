import { ICommand } from '@abms/kernel';

export class DeactivateVehicleCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly vehicleId: string) {}
}
