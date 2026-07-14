import { validate } from 'class-validator';
import { UploadEmployeeDocumentDto } from './upload-employee-document.dto';

function validDto(overrides: Partial<UploadEmployeeDocumentDto> = {}): UploadEmployeeDocumentDto {
  const dto = new UploadEmployeeDocumentDto();
  dto.documentType = 'CONTRACT';
  dto.fileName = 'contract.pdf';
  dto.fileUrl = 'https://storage.example.com/contract.pdf';
  return Object.assign(dto, overrides);
}

describe('UploadEmployeeDocumentDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid documentType', async () => {
    const errors = await validate(
      validDto({ documentType: 'PASSPORT' as UploadEmployeeDocumentDto['documentType'] }),
    );

    expect(errors.some((error) => error.property === 'documentType')).toBe(true);
  });

  it('rejects an empty fileName', async () => {
    const errors = await validate(validDto({ fileName: '' }));

    expect(errors.some((error) => error.property === 'fileName')).toBe(true);
  });

  it('rejects an invalid fileUrl', async () => {
    const errors = await validate(validDto({ fileUrl: 'not-a-url' }));

    expect(errors.some((error) => error.property === 'fileUrl')).toBe(true);
  });
});
