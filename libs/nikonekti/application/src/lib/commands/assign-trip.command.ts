import { ICommand } from '@abms/kernel';

export class AssignTripCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly tripId: string,
    public readonly driverId: string,
    public readonly vehicleId: string,
  ) {}
}
