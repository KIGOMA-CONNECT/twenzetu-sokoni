import { EntityId, TenantId } from '@abms/kernel';
import { EmployeeDocument } from '@abms/hr-domain';
import type { EntityManager, Repository } from 'typeorm';
import { EmployeeDocumentOrmEntity } from '../entities/employee-document-orm.entity';
import { TypeOrmEmployeeDocumentRepository } from './typeorm-employee-document.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<EmployeeDocumentOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<EmployeeDocumentOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmEmployeeDocumentRepository', () => {
  it('findByEmployeeId reconstitutes documents ordered by uploadedAt desc', async () => {
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: EntityId.create().toValue(),
        tenantId: TENANT_ID.value,
        employeeId: employeeId.toValue(),
        documentType: 'CONTRACT',
        fileName: 'contract.pdf',
        fileUrl: 'https://storage.example.com/contract.pdf',
        uploadedByUserId: 'user-1',
        uploadedAt: new Date('2026-01-01'),
      } as EmployeeDocumentOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmEmployeeDocumentRepository(
      manager as unknown as EntityManager,
    ).findByEmployeeId(TENANT_ID, employeeId);

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID.value, employeeId: employeeId.toValue() },
      order: { uploadedAt: 'DESC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].documentType).toBe('CONTRACT');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const document = EmployeeDocument.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      documentType: 'CONTRACT',
      fileName: 'contract.pdf',
      fileUrl: 'https://storage.example.com/contract.pdf',
      uploadedByUserId: 'user-1',
    });

    await new TypeOrmEmployeeDocumentRepository(manager as unknown as EntityManager).save(document);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: document.id.toValue(), fileName: 'contract.pdf' }),
    );
  });
});
