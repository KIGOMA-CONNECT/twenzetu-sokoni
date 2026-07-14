import { ICommand } from '@abms/kernel';

export interface StartWorkflowResult {
  readonly id: string;
}

export class StartWorkflowCommand implements ICommand<StartWorkflowResult> {
  public readonly _resultType?: StartWorkflowResult;

  public constructor(
    public readonly workflowDefinitionId: string,
    public readonly subjectType: string,
    public readonly subjectId: string,
  ) {}
}
