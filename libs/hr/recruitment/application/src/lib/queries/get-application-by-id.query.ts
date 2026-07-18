import { IQuery } from '@abms/kernel';
import { ApplicationReadModel } from '../read-models/application-read-model';

export class GetApplicationByIdQuery implements IQuery<ApplicationReadModel | null> {
  public readonly _resultType?: ApplicationReadModel | null;

  public constructor(public readonly applicationId: string) {}
}
