export interface WorkflowStepApprovalReadModel {
  readonly stepOrder: number;
  readonly approverRole: string;
  readonly status: 'PENDING' | 'APPROVED' | 'REJECTED';
  readonly decidedByUserId: string | null;
  readonly decidedAt: Date | null;
  readonly comment: string | null;
}

export interface WorkflowInstanceReadModel {
  readonly id: string;
  readonly workflowDefinitionId: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly status: 'PENDING' | 'APPROVED' | 'REJECTED';
  readonly steps: WorkflowStepApprovalReadModel[];
  readonly version: number;
}
