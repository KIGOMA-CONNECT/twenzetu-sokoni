import { AggregateRoot, EntityId, Guard, TenantId } from '@abms/kernel';

export type EmployeeDocumentType = 'CONTRACT' | 'ID_DOCUMENT' | 'CV' | 'CERTIFICATE' | 'OTHER';

interface CreateEmployeeDocumentProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly documentType: EmployeeDocumentType;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly uploadedByUserId: string;
}

interface ReconstituteEmployeeDocumentProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly documentType: EmployeeDocumentType;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly uploadedByUserId: string;
  readonly uploadedAt: Date;
}

// Stores document *metadata* only — fileUrl points at wherever the caller
// already uploaded the file (e.g. object storage). Building an actual file
// upload/storage pipeline is the separate, not-yet-built Document Management
// Foundation capability (Constitution Ch.6); this deliberately does not
// duplicate that here.
export class EmployeeDocument extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _documentType: EmployeeDocumentType,
    private readonly _fileName: string,
    private readonly _fileUrl: string,
    private readonly _uploadedByUserId: string,
    private readonly _uploadedAt: Date,
  ) {
    super(id);
  }

  public static create(props: CreateEmployeeDocumentProps): EmployeeDocument {
    Guard.assert(Guard.againstEmptyString(props.fileName, 'fileName'));
    Guard.assert(Guard.againstEmptyString(props.fileUrl, 'fileUrl'));
    Guard.assert(Guard.againstEmptyString(props.uploadedByUserId, 'uploadedByUserId'));

    return new EmployeeDocument(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.documentType,
      props.fileName,
      props.fileUrl,
      props.uploadedByUserId,
      new Date(),
    );
  }

  public static reconstitute(props: ReconstituteEmployeeDocumentProps): EmployeeDocument {
    return new EmployeeDocument(
      props.id,
      props.tenantId,
      props.employeeId,
      props.documentType,
      props.fileName,
      props.fileUrl,
      props.uploadedByUserId,
      props.uploadedAt,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get documentType(): EmployeeDocumentType {
    return this._documentType;
  }

  public get fileName(): string {
    return this._fileName;
  }

  public get fileUrl(): string {
    return this._fileUrl;
  }

  public get uploadedByUserId(): string {
    return this._uploadedByUserId;
  }

  public get uploadedAt(): Date {
    return this._uploadedAt;
  }
}
