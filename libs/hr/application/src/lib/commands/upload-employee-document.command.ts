import { ICommand } from '@abms/kernel';

export interface UploadEmployeeDocumentResult {
  readonly id: string;
}

export class UploadEmployeeDocumentCommand implements ICommand<UploadEmployeeDocumentResult> {
  public readonly _resultType?: UploadEmployeeDocumentResult;

  public constructor(
    public readonly employeeId: string,
    public readonly documentType: 'CONTRACT' | 'ID_DOCUMENT' | 'CV' | 'CERTIFICATE' | 'OTHER',
    public readonly fileName: string,
    public readonly fileUrl: string,
  ) {}
}
