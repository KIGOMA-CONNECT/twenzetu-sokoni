import { BusinessRuleViolationException, Email, EntityId, TenantId } from '@abms/kernel';
import { Employee } from './employee.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const EMAIL = Email.create('jane.doe@example.com').getValue();

function createEmployee() {
  return Employee.create({
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
    hireDate: new Date('2026-01-01'),
    employmentType: 'FULL_TIME',
  });
}

describe('Employee.create', () => {
  it('defaults to ACTIVE status, version 1', () => {
    const employee = createEmployee();

    expect(employee.status).toBe('ACTIVE');
    expect(employee.version).toBe(1);
    expect(employee.terminationDate).toBeNull();
  });

  it('rejects an empty employeeNumber', () => {
    expect(() =>
      Employee.create({
        tenantId: TENANT_ID,
        userId: null,
        employeeNumber: '',
        firstName: 'Jane',
        lastName: 'Doe',
        email: EMAIL,
        phone: null,
        dateOfBirth: null,
        gender: null,
        positionId: null,
        orgUnitId: null,
        hireDate: new Date(),
        employmentType: 'FULL_TIME',
      }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('Employee mutators', () => {
  it('updatePersonalDetails() updates only the given fields', () => {
    const employee = createEmployee();

    employee.updatePersonalDetails({ phone: '+255700000000' });

    expect(employee.phone).toBe('+255700000000');
    expect(employee.firstName).toBe('Jane');
    expect(employee.version).toBe(2);
  });

  it('changePosition() records the transition', () => {
    const employee = createEmployee();
    const positionId = EntityId.create();

    employee.changePosition(positionId);

    expect(employee.positionId?.equals(positionId)).toBe(true);
  });

  it('transferToOrgUnit() records the transition', () => {
    const employee = createEmployee();

    employee.transferToOrgUnit('org-unit-1');

    expect(employee.orgUnitId).toBe('org-unit-1');
  });

  it('suspend()/reactivate() toggle status', () => {
    const employee = createEmployee();

    employee.suspend();
    expect(employee.status).toBe('SUSPENDED');

    employee.reactivate();
    expect(employee.status).toBe('ACTIVE');
  });

  it('rejects suspending an already-suspended employee', () => {
    const employee = createEmployee();
    employee.suspend();

    expect(() => employee.suspend()).toThrow(BusinessRuleViolationException);
  });

  it('terminate() sets status and terminationDate, and blocks all further mutations', () => {
    const employee = createEmployee();
    const terminationDate = new Date('2026-06-01');

    employee.terminate(terminationDate);

    expect(employee.status).toBe('TERMINATED');
    expect(employee.terminationDate).toEqual(terminationDate);
    expect(() => employee.suspend()).toThrow(BusinessRuleViolationException);
    expect(() => employee.changePosition(EntityId.create())).toThrow(BusinessRuleViolationException);
    expect(() => employee.updatePersonalDetails({ phone: '123' })).toThrow(BusinessRuleViolationException);
  });

  it('linkUserAccount() sets the userId', () => {
    const employee = createEmployee();

    employee.linkUserAccount('user-1');

    expect(employee.userId).toBe('user-1');
  });
});

describe('Employee.reconstitute', () => {
  it('rebuilds an employee from persisted state', () => {
    const id = EntityId.create();

    const employee = Employee.reconstitute({
      id,
      tenantId: TENANT_ID,
      userId: 'user-1',
      employeeNumber: 'EMP-0001',
      firstName: 'Jane',
      lastName: 'Doe',
      email: EMAIL,
      phone: null,
      dateOfBirth: null,
      gender: null,
      positionId: null,
      orgUnitId: null,
      hireDate: new Date('2026-01-01'),
      employmentType: 'FULL_TIME',
      status: 'TERMINATED',
      terminationDate: new Date('2026-06-01'),
      version: 4,
    });

    expect(employee.id.equals(id)).toBe(true);
    expect(employee.status).toBe('TERMINATED');
    expect(employee.version).toBe(4);
  });
});
