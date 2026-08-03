import { IQuery } from '@abms/kernel';
import { VehicleReadModel } from '../read-models/vehicle-read-model';

export class ListVehiclesQuery implements IQuery<VehicleReadModel[]> {
  public readonly _resultType?: VehicleReadModel[];
}
