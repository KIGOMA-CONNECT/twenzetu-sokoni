import { IQuery } from '@abms/kernel';
import { DriverReadModel } from '../read-models/driver-read-model';

export class ListDriversQuery implements IQuery<DriverReadModel[]> {
  public readonly _resultType?: DriverReadModel[];
}
