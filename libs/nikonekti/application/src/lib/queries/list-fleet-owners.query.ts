import { IQuery } from '@abms/kernel';
import { FleetOwnerReadModel } from '../read-models/fleet-owner-read-model';

export class ListFleetOwnersQuery implements IQuery<FleetOwnerReadModel[]> {
  public readonly _resultType?: FleetOwnerReadModel[];
}
