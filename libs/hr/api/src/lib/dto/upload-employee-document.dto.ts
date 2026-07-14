import { IsIn, IsNotEmpty, IsString, IsUrl } from 'class-validator';

const DOCUMENT_TYPES = ['CONTRACT', 'ID_DOCUMENT', 'CV', 'CERTIFICATE', 'OTHER'] as const;

export class UploadEmployeeDocumentDto {
  @IsIn(DOCUMENT_TYPES)
  public documentType!: (typeof DOCUMENT_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  public fileName!: string;

  @IsUrl()
  public fileUrl!: string;
}
