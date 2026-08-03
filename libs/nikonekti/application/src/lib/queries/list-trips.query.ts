import { IQuery } from '@abms/kernel';
import { TripReadModel } from '../read-models/trip-read-model';

export class ListTripsQuery implements IQuery<TripReadModel[]> {
  public readonly _resultType?: TripReadModel[];
}
