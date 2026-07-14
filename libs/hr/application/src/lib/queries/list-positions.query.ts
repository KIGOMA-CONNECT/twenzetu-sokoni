import { IQuery } from '@abms/kernel';
import { PositionReadModel } from '../read-models/position-read-model';

export class ListPositionsQuery implements IQuery<PositionReadModel[]> {
  public readonly _resultType?: PositionReadModel[];
}
