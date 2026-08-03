import { ICommand } from '@abms/kernel';

export interface AllowanceInput {
  readonly name: string;
  readonly amount: number;
}

export interface SetSalaryStructureResult {
  readonly id: string;
}

export class SetSalaryStructureCommand implements ICommand<SetSalaryStructureResult> {
  public readonly _resultType?: SetSalaryStructureResult;

  public constructor(
    public readonly employeeId: string,
    public readonly basicSalary: number,
    public readonly allowances: AllowanceInput[],
    public readonly effectiveFrom: string,
  ) {}
}
