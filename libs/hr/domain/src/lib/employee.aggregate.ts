import { AggregateRoot, BusinessRuleViolationException, Email, EntityId, Guard, TenantId } from '@abms/kernel';
import { EmployeeHiredEvent } from './events/employee-hired.event';
import { EmployeePositionChangedEvent } from './events/employee-position-changed.event';
import { EmployeeReactivatedEvent } from './events/employee-reactivated.event';
import { EmployeeSuspendedEvent } from './events/employee-suspended.event';
import { EmployeeTerminatedEvent } from './events/employee-terminated.event';
import { EmployeeTransferredEvent } from './events/employee-transferred.event';

export type EmployeeGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

interface CreateEmployeeProps {
  readonly tenantId: TenantId;
  readonly userId: string | null;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: Email;
  readonly phone: string | null;
  readonly dateOfBirth: Date | null;
  readonly gender: EmployeeGender | null;
  readonly positionId: EntityId | null;
  readonly orgUnitId: string | null;
  readonly hireDate: Date;
  readonly employmentType: EmploymentType;
}

interface ReconstituteEmployeeProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly userId: string | null;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: Email;
  readonly phone: string | null;
  readonly dateOfBirth: Date | null;
  readonly gender: EmployeeGender | null;
  readonly positionId: EntityId | null;
  readonly orgUnitId: string | null;
  readonly hireDate: Date;
  readonly employmentType: EmploymentType;
  readonly status: EmployeeStatus;
  readonly terminationDate: Date | null;
  readonly version: number;
}

export class Employee extends AggregateRoot<EntityId> {
  private _userId: string | null;
  private _firstName: string;
  private _lastName: string;
  private _email: Email;
  private _phone: string | null;
  private _dateOfBirth: Date | null;
  private _gender: EmployeeGender | null;
  private _positionId: EntityId | null;
  private _orgUnitId: string | null;
  private _employmentType: EmploymentType;
  private _status: EmployeeStatus;
  private _terminationDate: Date | null;
  private _version: number;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    userId: string | null,
    private readonly _employeeNumber: string,
    firstName: string,
    lastName: string,
    email: Email,
    phone: string | null,
    dateOfBirth: Date | null,
    gender: EmployeeGender | null,
    positionId: EntityId | null,
    orgUnitId: string | null,
    private readonly _hireDate: Date,
    employmentType: EmploymentType,
    status: EmployeeStatus,
    terminationDate: Date | null,
    version: number,
  ) {
    super(id);
    this._userId = userId;
    this._firstName = firstName;
    this._lastName = lastName;
    this._email = email;
    this._phone = phone;
    this._dateOfBirth = dateOfBirth;
    this._gender = gender;
    this._positionId = positionId;
    this._orgUnitId = orgUnitId;
    this._employmentType = employmentType;
    this._status = status;
    this._terminationDate = terminationDate;
    this._version = version;
  }

  public static create(props: CreateEmployeeProps): Employee {
    Guard.assert(Guard.againstEmptyString(props.employeeNumber, 'employeeNumber'));
    Guard.assert(Guard.againstEmptyString(props.firstName, 'firstName'));
    Guard.assert(Guard.againstEmptyString(props.lastName, 'lastName'));

    const employee = new Employee(
      EntityId.create(),
      props.tenantId,
      props.userId,
      props.employeeNumber,
      props.firstName,
      props.lastName,
      props.email,
      props.phone,
      props.dateOfBirth,
      props.gender,
      props.positionId,
      props.orgUnitId,
      props.hireDate,
      props.employmentType,
      'ACTIVE',
      null,
      1,
    );
    employee.addDomainEvent(
      new EmployeeHiredEvent(employee.id.toValue(), props.tenantId.value, props.employeeNumber),
    );
    return employee;
  }

  public static reconstitute(props: ReconstituteEmployeeProps): Employee {
    return new Employee(
      props.id,
      props.tenantId,
      props.userId,
      props.employeeNumber,
      props.firstName,
      props.lastName,
      props.email,
      props.phone,
      props.dateOfBirth,
      props.gender,
      props.positionId,
      props.orgUnitId,
      props.hireDate,
      props.employmentType,
      props.status,
      props.terminationDate,
      props.version,
    );
  }

  private assertNotTerminated(action: string): void {
    if (this._status === 'TERMINATED') {
      throw new BusinessRuleViolationException(
        `Cannot ${action}: employee "${this._employeeNumber}" was terminated.`,
      );
    }
  }

  public updatePersonalDetails(props: {
    firstName?: string;
    lastName?: string;
    email?: Email;
    phone?: string | null;
    dateOfBirth?: Date | null;
    gender?: EmployeeGender | null;
  }): void {
    this.assertNotTerminated('update personal details');
    if (props.firstName !== undefined) {
      Guard.assert(Guard.againstEmptyString(props.firstName, 'firstName'));
      this._firstName = props.firstName;
    }
    if (props.lastName !== undefined) {
      Guard.assert(Guard.againstEmptyString(props.lastName, 'lastName'));
      this._lastName = props.lastName;
    }
    if (props.email !== undefined) {
      this._email = props.email;
    }
    if (props.phone !== undefined) {
      this._phone = props.phone;
    }
    if (props.dateOfBirth !== undefined) {
      this._dateOfBirth = props.dateOfBirth;
    }
    if (props.gender !== undefined) {
      this._gender = props.gender;
    }
    this._version += 1;
  }

  public linkUserAccount(userId: string): void {
    this.assertNotTerminated('link a user account');
    Guard.assert(Guard.againstEmptyString(userId, 'userId'));
    this._userId = userId;
    this._version += 1;
  }

  public changePosition(newPositionId: EntityId | null): void {
    this.assertNotTerminated('change position');
    const previousPositionId = this._positionId;
    this._positionId = newPositionId;
    this.addDomainEvent(
      new EmployeePositionChangedEvent(
        this.id.toValue(),
        this._tenantId.value,
        previousPositionId?.toValue() ?? null,
        newPositionId?.toValue() ?? null,
      ),
    );
    this._version += 1;
  }

  public transferToOrgUnit(newOrgUnitId: string | null): void {
    this.assertNotTerminated('transfer org unit');
    const previousOrgUnitId = this._orgUnitId;
    this._orgUnitId = newOrgUnitId;
    this.addDomainEvent(
      new EmployeeTransferredEvent(this.id.toValue(), this._tenantId.value, previousOrgUnitId, newOrgUnitId),
    );
    this._version += 1;
  }

  public suspend(): void {
    this.assertNotTerminated('suspend');
    if (this._status === 'SUSPENDED') {
      throw new BusinessRuleViolationException(
        `Employee "${this._employeeNumber}" is already suspended.`,
      );
    }
    this._status = 'SUSPENDED';
    this.addDomainEvent(new EmployeeSuspendedEvent(this.id.toValue(), this._tenantId.value));
    this._version += 1;
  }

  public reactivate(): void {
    this.assertNotTerminated('reactivate');
    if (this._status === 'ACTIVE') {
      throw new BusinessRuleViolationException(`Employee "${this._employeeNumber}" is already active.`);
    }
    this._status = 'ACTIVE';
    this.addDomainEvent(new EmployeeReactivatedEvent(this.id.toValue(), this._tenantId.value));
    this._version += 1;
  }

  public terminate(terminationDate: Date): void {
    this.assertNotTerminated('terminate');
    this._status = 'TERMINATED';
    this._terminationDate = terminationDate;
    this.addDomainEvent(
      new EmployeeTerminatedEvent(this.id.toValue(), this._tenantId.value, terminationDate.toISOString()),
    );
    this._version += 1;
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get userId(): string | null {
    return this._userId;
  }

  public get employeeNumber(): string {
    return this._employeeNumber;
  }

  public get firstName(): string {
    return this._firstName;
  }

  public get lastName(): string {
    return this._lastName;
  }

  public get email(): Email {
    return this._email;
  }

  public get phone(): string | null {
    return this._phone;
  }

  public get dateOfBirth(): Date | null {
    return this._dateOfBirth;
  }

  public get gender(): EmployeeGender | null {
    return this._gender;
  }

  public get positionId(): EntityId | null {
    return this._positionId;
  }

  public get orgUnitId(): string | null {
    return this._orgUnitId;
  }

  public get hireDate(): Date {
    return this._hireDate;
  }

  public get employmentType(): EmploymentType {
    return this._employmentType;
  }

  public get status(): EmployeeStatus {
    return this._status;
  }

  public get terminationDate(): Date | null {
    return this._terminationDate;
  }

  public get version(): number {
    return this._version;
  }
}
