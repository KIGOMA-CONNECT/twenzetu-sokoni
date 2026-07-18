import { ICommand } from '@abms/kernel';

export interface HireCandidateResult {
  readonly employeeId: string;
}

// Deliberately not a thin wrapper around hr-application's CreateEmployeeCommand
// dispatched over the command bus — that would open a second, independent
// database transaction (TenantAwareUnitOfWork.withTransaction() always opens
// a fresh connection), breaking atomicity between "application is HIRED" and
// "employee row exists". See ADR-0011: HireCandidateHandler constructs the
// Employee aggregate directly, in the same transaction.
export class HireCandidateCommand implements ICommand<HireCandidateResult> {
  public readonly _resultType?: HireCandidateResult;

  public constructor(
    public readonly applicationId: string,
    public readonly employeeNumber: string,
    public readonly hireDate: string,
    public readonly employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN',
    public readonly orgUnitId?: string | null,
  ) {}
}
