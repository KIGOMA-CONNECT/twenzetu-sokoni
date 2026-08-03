import { IQuery } from '@abms/kernel';
import { TripReadModel } from '../read-models/trip-read-model';

export class ListTripsForDriverQuery implements IQuery<TripReadModel[]> {
  public readonly _resultType?: TripReadModel[];

  public constructor(public readonly driverId: string) {}
}
