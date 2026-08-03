import { Email, EntityId, TenantId } from '@abms/kernel';
import { Employee } from '@abms/hr-domain';
import type { EntityManager, Repository } from 'typeorm';
import { EmployeeOrmEntity } from '../entities/employee-orm.entity';
import { TypeOrmEmployeeRepository } from './typeorm-employee.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const EMAIL = Email.create('jane.doe@example.com').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<EmployeeOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<EmployeeOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmEmployeeRepository', () => {
  it('findByEmployeeNumber reconstitutes a domain Employee', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      userId: null,
      employeeNumber: 'EMP-0001',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: null,
      dateOfBirth: null,
      gender: null,
      positionId: null,
      orgUnitId: null,
      hireDate: '2026-01-01',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      terminationDate: null,
      version: 1,
    } as EmployeeOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmEmployeeRepository(manager as unknown as EntityManager).findByEmployeeNumber(
      TENANT_ID,
      'EMP-0001',
    );

    expect(result?.firstName).toBe('Jane');
    expect(result?.status).toBe('ACTIVE');
  });

  it('save() upserts the row with dates converted to date-only strings', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const employee = Employee.create({
      tenantId: TENANT_ID,
      userId: null,
      employeeNumber: 'EMP-0001',
      firstName: 'Jane',
      lastName: 'Doe',
      email: EMAIL,
      phone: null,
      dateOfBirth: null,
      gender: null,
      positionId: null,
      orgUnitId: null,
      hireDate: new Date('2026-01-01T00:00:00.000Z'),
      employmentType: 'FULL_TIME',
    });

    await new TypeOrmEmployeeRepository(manager as unknown as EntityManager).save(employee);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: employee.id.toValue(),
        employeeNumber: 'EMP-0001',
        hireDate: '2026-01-01',
        email: 'jane.doe@example.com',
      }),
    );
  });
});
