import { EntityId, TenantId } from '@abms/kernel';
import { EmployeeComplianceRecord } from '@abms/hr-compliance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { EmployeeComplianceRecordOrmEntity } from '../entities/employee-compliance-record-orm.entity';
import { TypeOrmEmployeeComplianceRecordRepository } from './typeorm-employee-compliance-record.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<EmployeeComplianceRecordOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<EmployeeComplianceRecordOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmEmployeeComplianceRecordRepository', () => {
  it('findPendingByEmployeeAndRequirement reconstitutes a domain EmployeeComplianceRecord', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const requirementId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      complianceRequirementId: requirementId.toValue(),
      dueDate: '2026-12-31',
      status: 'PENDING',
      completedDate: null,
      exemptionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EmployeeComplianceRecordOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmEmployeeComplianceRecordRepository(
      manager as unknown as EntityManager,
    ).findPendingByEmployeeAndRequirement(TENANT_ID, employeeId, requirementId);

    expect(result?.status).toBe('PENDING');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const record = EmployeeComplianceRecord.assign({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      complianceRequirementId: EntityId.create(),
      dueDate: new Date('2026-12-31'),
    });

    await new TypeOrmEmployeeComplianceRecordRepository(manager as unknown as EntityManager).save(record);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: record.id.toValue(), status: 'PENDING' }),
    );
  });
});
