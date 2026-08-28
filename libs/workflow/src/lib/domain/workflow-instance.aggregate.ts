import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type WorkflowInstanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface WorkflowInstanceProps {
  readonly workflowId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly tenantId: string;
  readonly initiatedBy: string;
  readonly data?: Record<string, unknown>;
}

export interface WorkflowActionProps {
  readonly stepName: string;
  readonly action: 'APPROVE' | 'REJECT' | 'SKIP';
  readonly performedBy: string;
  readonly comment?: string;
}

export class WorkflowInstance extends AggregateRoot<EntityId> {
  private _status: WorkflowInstanceStatus;
  private _currentStepIndex: number;
  private _actions: Array<{
    stepName: string;
    action: string;
    performedBy: string;
    comment?: string;
    performedAt: Date;
  }>;

  private constructor(
    id: EntityId,
    private readonly _workflowId: string,
    private readonly _entityType: string,
    private readonly _entityId: string,
    private readonly _tenantId: string,
    private readonly _initiatedBy: string,
    private readonly _data: Record<string, unknown>,
    status: WorkflowInstanceStatus,
    currentStepIndex: number,
    actions: Array<{
      stepName: string;
      action: string;
      performedBy: string;
      comment?: string;
      performedAt: Date;
    }>,
  ) {
    super(id);
    this._status = status;
    this._currentStepIndex = currentStepIndex;
    this._actions = actions;
  }

  public static initiate(props: WorkflowInstanceProps): WorkflowInstance {
    Guard.assert(Guard.againstEmptyString(props.workflowId, 'workflowId'));
    Guard.assert(Guard.againstEmptyString(props.entityId, 'entityId'));
    Guard.assert(Guard.againstEmptyString(props.tenantId, 'tenantId'));
    Guard.assert(Guard.againstEmptyString(props.initiatedBy, 'initiatedBy'));

    return new WorkflowInstance(
      EntityId.create(),
      props.workflowId,
      props.entityType,
      props.entityId,
      props.tenantId,
      props.initiatedBy,
      props.data ?? {},
      'IN_PROGRESS',
      0,
      [],
    );
  }

  public get workflowId(): string { return this._workflowId; }
  public get entityType(): string { return this._entityType; }
  public get entityId(): string { return this._entityId; }
  public get tenantId(): string { return this._tenantId; }
  public get initiatedBy(): string { return this._initiatedBy; }
  public get data(): Record<string, unknown> { return { ...this._data }; }
  public get status(): WorkflowInstanceStatus { return this._status; }
  public get currentStepIndex(): number { return this._currentStepIndex; }
  public get actions(): Array<{ stepName: string; action: string; performedBy: string; comment?: string; performedAt: Date }> {
    return [...this._actions];
  }

  public approveStep(stepName: string, performedBy: string, comment?: string): void {
    if (this._status !== 'IN_PROGRESS') {
      throw new Error('Workflow is not in progress');
    }
    this._actions.push({
      stepName,
      action: 'APPROVE',
      performedBy,
      comment,
      performedAt: new Date(),
    });
    this._currentStepIndex++;
  }

  public rejectStep(stepName: string, performedBy: string, comment?: string): void {
    if (this._status !== 'IN_PROGRESS') {
      throw new Error('Workflow is not in progress');
    }
    this._actions.push({
      stepName,
      action: 'REJECT',
      performedBy,
      comment,
      performedAt: new Date(),
    });
    this._status = 'REJECTED';
  }

  public complete(): void {
    this._status = 'COMPLETED';
  }

  public cancel(): void {
    this._status = 'CANCELLED';
  }

  public expire(): void {
    this._status = 'EXPIRED';
  }
}
