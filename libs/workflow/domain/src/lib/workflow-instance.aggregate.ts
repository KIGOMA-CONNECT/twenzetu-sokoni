import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { WorkflowInstanceCompletedEvent } from './events/workflow-instance-completed.event';
import { WorkflowInstanceStartedEvent } from './events/workflow-instance-started.event';
import { WorkflowStepApprovedEvent } from './events/workflow-step-approved.event';
import { WorkflowStepRejectedEvent } from './events/workflow-step-rejected.event';
import { WorkflowStepTemplate } from './workflow-definition.aggregate';

export type WorkflowInstanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WorkflowStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WorkflowStepApproval {
  readonly stepOrder: number;
  readonly approverRole: string;
  readonly status: WorkflowStepStatus;
  readonly decidedByUserId: string | null;
  readonly decidedAt: Date | null;
  readonly comment: string | null;
}

interface StartWorkflowInstanceProps {
  readonly tenantId: TenantId;
  readonly workflowDefinitionId: EntityId;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly steps: readonly WorkflowStepTemplate[];
}

interface ReconstituteWorkflowInstanceProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly workflowDefinitionId: EntityId;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly status: WorkflowInstanceStatus;
  readonly steps: readonly WorkflowStepApproval[];
  readonly version: number;
}

export class WorkflowInstance extends AggregateRoot<EntityId> {
  private _status: WorkflowInstanceStatus;
  private _steps: readonly WorkflowStepApproval[];
  private _version: number;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _workflowDefinitionId: EntityId,
    private readonly _subjectType: string,
    private readonly _subjectId: string,
    status: WorkflowInstanceStatus,
    steps: readonly WorkflowStepApproval[],
    version: number,
  ) {
    super(id);
    this._status = status;
    this._steps = steps;
    this._version = version;
  }

  public static start(props: StartWorkflowInstanceProps): WorkflowInstance {
    Guard.assert(Guard.againstEmptyString(props.subjectType, 'subjectType'));
    Guard.assert(Guard.againstEmptyString(props.subjectId, 'subjectId'));
    Guard.assert(Guard.inRange(props.steps.length, 1, Number.MAX_SAFE_INTEGER, 'steps'));

    const steps: WorkflowStepApproval[] = [...props.steps]
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((step) => ({
        stepOrder: step.stepOrder,
        approverRole: step.approverRole,
        status: 'PENDING',
        decidedByUserId: null,
        decidedAt: null,
        comment: null,
      }));

    const instance = new WorkflowInstance(
      EntityId.create(),
      props.tenantId,
      props.workflowDefinitionId,
      props.subjectType,
      props.subjectId,
      'PENDING',
      steps,
      1,
    );
    instance.addDomainEvent(
      new WorkflowInstanceStartedEvent(
        instance.id.toValue(),
        props.tenantId.value,
        props.workflowDefinitionId.toValue(),
        props.subjectType,
        props.subjectId,
      ),
    );
    return instance;
  }

  public static reconstitute(props: ReconstituteWorkflowInstanceProps): WorkflowInstance {
    return new WorkflowInstance(
      props.id,
      props.tenantId,
      props.workflowDefinitionId,
      props.subjectType,
      props.subjectId,
      props.status,
      props.steps,
      props.version,
    );
  }

  private currentPendingStep(): WorkflowStepApproval | undefined {
    return this._steps.find((step) => step.status === 'PENDING');
  }

  public approveStep(
    stepOrder: number,
    approverUserId: string,
    approverRole: string,
    comment: string | null,
  ): void {
    if (this._status !== 'PENDING') {
      throw new BusinessRuleViolationException(
        `Workflow instance is already ${this._status}; no further approvals are possible.`,
      );
    }

    const currentStep = this.currentPendingStep();
    if (!currentStep || currentStep.stepOrder !== stepOrder) {
      throw new BusinessRuleViolationException(
        `Step ${stepOrder} is not the current pending step` +
          (currentStep ? ` (expected step ${currentStep.stepOrder}).` : '.'),
      );
    }
    if (currentStep.approverRole !== approverRole) {
      throw new BusinessRuleViolationException(
        `Step ${stepOrder} requires approver role "${currentStep.approverRole}", but "${approverRole}" was provided.`,
      );
    }

    this._steps = this._steps.map((step) =>
      step.stepOrder === stepOrder
        ? { ...step, status: 'APPROVED', decidedByUserId: approverUserId, decidedAt: new Date(), comment }
        : step,
    );
    this.addDomainEvent(new WorkflowStepApprovedEvent(this.id.toValue(), this._tenantId.value, stepOrder, approverUserId));

    if (!this.currentPendingStep()) {
      this._status = 'APPROVED';
      this.addDomainEvent(new WorkflowInstanceCompletedEvent(this.id.toValue(), this._tenantId.value));
    }
    this._version += 1;
  }

  public rejectStep(
    stepOrder: number,
    approverUserId: string,
    approverRole: string,
    comment: string | null,
  ): void {
    if (this._status !== 'PENDING') {
      throw new BusinessRuleViolationException(
        `Workflow instance is already ${this._status}; no further decisions are possible.`,
      );
    }

    const currentStep = this.currentPendingStep();
    if (!currentStep || currentStep.stepOrder !== stepOrder) {
      throw new BusinessRuleViolationException(
        `Step ${stepOrder} is not the current pending step` +
          (currentStep ? ` (expected step ${currentStep.stepOrder}).` : '.'),
      );
    }
    if (currentStep.approverRole !== approverRole) {
      throw new BusinessRuleViolationException(
        `Step ${stepOrder} requires approver role "${currentStep.approverRole}", but "${approverRole}" was provided.`,
      );
    }

    this._steps = this._steps.map((step) =>
      step.stepOrder === stepOrder
        ? { ...step, status: 'REJECTED', decidedByUserId: approverUserId, decidedAt: new Date(), comment }
        : step,
    );
    this._status = 'REJECTED';
    this.addDomainEvent(new WorkflowStepRejectedEvent(this.id.toValue(), this._tenantId.value, stepOrder, approverUserId));
    this._version += 1;
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get workflowDefinitionId(): EntityId {
    return this._workflowDefinitionId;
  }

  public get subjectType(): string {
    return this._subjectType;
  }

  public get subjectId(): string {
    return this._subjectId;
  }

  public get status(): WorkflowInstanceStatus {
    return this._status;
  }

  public get steps(): readonly WorkflowStepApproval[] {
    return this._steps;
  }

  public get version(): number {
    return this._version;
  }
}
