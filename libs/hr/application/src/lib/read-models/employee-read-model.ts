export interface EmployeeReadModel {
  readonly id: string;
  readonly userId: string | null;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly dateOfBirth: string | null;
  readonly gender: string | null;
  readonly positionId: string | null;
  readonly orgUnitId: string | null;
  readonly hireDate: string;
  readonly employmentType: string;
  readonly status: string;
  readonly terminationDate: string | null;
  readonly version: number;
}
