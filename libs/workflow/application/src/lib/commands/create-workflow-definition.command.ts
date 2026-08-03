import { ICommand } from '@abms/kernel';

export interface CreateWorkflowDefinitionResult {
  readonly id: string;
}

export class CreateWorkflowDefinitionCommand implements ICommand<CreateWorkflowDefinitionResult> {
  public readonly _resultType?: CreateWorkflowDefinitionResult;

  public constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly approverRoles: string[],
  ) {}
}
