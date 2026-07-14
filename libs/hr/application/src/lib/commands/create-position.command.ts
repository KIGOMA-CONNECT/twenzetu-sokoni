import { ICommand } from '@abms/kernel';

export interface CreatePositionResult {
  readonly id: string;
}

export class CreatePositionCommand implements ICommand<CreatePositionResult> {
  public readonly _resultType?: CreatePositionResult;

  public constructor(
    public readonly code: string,
    public readonly title: string,
    public readonly description?: string,
  ) {}
}
