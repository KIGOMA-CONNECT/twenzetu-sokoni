import { ICommand } from '@abms/kernel';

export interface CreateEmployeeResult {
  readonly id: string;
}

export class CreateEmployeeCommand implements ICommand<CreateEmployeeResult> {
  public readonly _resultType?: CreateEmployeeResult;

  public constructor(
    public readonly employeeNumber: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly hireDate: string,
    public readonly employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN',
    public readonly phone?: string | null,
    public readonly dateOfBirth?: string | null,
    public readonly gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null,
    public readonly positionId?: string | null,
    public readonly orgUnitId?: string | null,
    public readonly userId?: string | null,
  ) {}
}
