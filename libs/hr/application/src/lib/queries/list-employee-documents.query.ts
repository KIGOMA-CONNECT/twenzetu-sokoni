import { IQuery } from '@abms/kernel';
import { EmployeeDocumentReadModel } from '../read-models/employee-document-read-model';

export class ListEmployeeDocumentsQuery implements IQuery<EmployeeDocumentReadModel[]> {
  public readonly _resultType?: EmployeeDocumentReadModel[];

  public constructor(public readonly employeeId: string) {}
}
