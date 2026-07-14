import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { EmployeeDocument } from './employee-document.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('EmployeeDocument.create', () => {
  it('builds a document with an uploadedAt timestamp', () => {
    const employeeId = EntityId.create();

    const document = EmployeeDocument.create({
      tenantId: TENANT_ID,
      employeeId,
      documentType: 'CONTRACT',
      fileName: 'employment-contract.pdf',
      fileUrl: 'https://storage.example.com/employment-contract.pdf',
      uploadedByUserId: 'user-1',
    });

    expect(document.employeeId.equals(employeeId)).toBe(true);
    expect(document.documentType).toBe('CONTRACT');
    expect(document.uploadedAt).toBeInstanceOf(Date);
  });

  it('rejects an empty fileName', () => {
    expect(() =>
      EmployeeDocument.create({
        tenantId: TENANT_ID,
        employeeId: EntityId.create(),
        documentType: 'CONTRACT',
        fileName: '',
        fileUrl: 'https://storage.example.com/x.pdf',
        uploadedByUserId: 'user-1',
      }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('EmployeeDocument.reconstitute', () => {
  it('rebuilds a document from persisted state', () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const uploadedAt = new Date('2026-01-01');

    const document = EmployeeDocument.reconstitute({
      id,
      tenantId: TENANT_ID,
      employeeId,
      documentType: 'ID_DOCUMENT',
      fileName: 'national-id.pdf',
      fileUrl: 'https://storage.example.com/national-id.pdf',
      uploadedByUserId: 'user-1',
      uploadedAt,
    });

    expect(document.id.equals(id)).toBe(true);
    expect(document.uploadedAt).toEqual(uploadedAt);
  });
});
