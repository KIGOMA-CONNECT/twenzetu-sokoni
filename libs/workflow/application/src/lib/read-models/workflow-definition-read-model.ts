export interface WorkflowDefinitionStepReadModel {
  readonly stepOrder: number;
  readonly approverRole: string;
}

export interface WorkflowDefinitionReadModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly steps: WorkflowDefinitionStepReadModel[];
  readonly isActive: boolean;
  readonly version: number;
}
