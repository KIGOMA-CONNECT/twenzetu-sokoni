import { ICommand } from '@abms/kernel';

export type VehicleCategoryInput = 'MOTORCYCLE' | 'TRICYCLE' | 'CAR' | 'VAN' | 'TRUCK';

export interface RegisterVehicleResult {
  readonly id: string;
}

export class RegisterVehicleCommand implements ICommand<RegisterVehicleResult> {
  public readonly _resultType?: RegisterVehicleResult;

  public constructor(
    public readonly plateNumber: string,
    public readonly category: VehicleCategoryInput,
    public readonly capacityKg: number,
    public readonly fleetOwnerId?: string | null,
  ) {}
}
