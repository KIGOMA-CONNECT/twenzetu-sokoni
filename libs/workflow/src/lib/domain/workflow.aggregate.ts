import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type StepType = 'APPROVAL' | 'NOTIFICATION' | 'CONDITION' | 'ACTION' | 'INTEGRATION';

export type StepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'COMPLETED';

export interface WorkflowStepProps {
  readonly name: string;
  readonly stepType: StepType;
  readonly assigneeRole: string;
  readonly order: number;
  readonly isRequired?: boolean;
  readonly timeoutHours?: number;
  readonly conditions?: Record<string, unknown>;
}

export interface WorkflowProps {
  readonly name: string;
  readonly description?: string;
  readonly entityType: string;
  readonly steps: WorkflowStepProps[];
}

export class WorkflowStep {
  private constructor(
    private readonly _name: string,
    private readonly _stepType: StepType,
    private readonly _assigneeRole: string,
    private readonly _order: number,
    private readonly _isRequired: boolean,
    private readonly _timeoutHours: number | undefined,
    private readonly _conditions: Record<string, unknown>,
  ) {}

  public static define(props: WorkflowStepProps): WorkflowStep {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(Guard.againstEmptyString(props.assigneeRole, 'assigneeRole'));

    return new WorkflowStep(
      props.name,
      props.stepType,
      props.assigneeRole,
      props.order,
      props.isRequired ?? true,
      props.timeoutHours,
      props.conditions ?? {},
    );
  }

  public get name(): string { return this._name; }
  public get stepType(): StepType { return this._stepType; }
  public get assigneeRole(): string { return this._assigneeRole; }
  public get order(): number { return this._order; }
  public get isRequired(): boolean { return this._isRequired; }
  public get timeoutHours(): number | undefined { return this._timeoutHours; }
  public get conditions(): Record<string, unknown> { return { ...this._conditions }; }
}

export class Workflow extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private _name: string,
    private _description: string | undefined,
    private readonly _entityType: string,
    private _steps: WorkflowStep[],
    private _status: WorkflowStatus,
  ) {
    super(id);
  }

  public static define(props: WorkflowProps): Workflow {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(Guard.againstEmptyString(props.entityType, 'entityType'));

    const steps = props.steps.map((s) => WorkflowStep.define(s));

    return new Workflow(
      EntityId.create(),
      props.name,
      props.description,
      props.entityType,
      steps,
      'DRAFT',
    );
  }

  public static reconstitute(props: {
    id: EntityId;
    name: string;
    description?: string;
    entityType: string;
    steps: WorkflowStep[];
    status: WorkflowStatus;
  }): Workflow {
    return new Workflow(
      props.id,
      props.name,
      props.description,
      props.entityType,
      props.steps,
      props.status,
    );
  }

  public get name(): string { return this._name; }
  public get description(): string | undefined { return this._description; }
  public get entityType(): string { return this._entityType; }
  public get steps(): WorkflowStep[] { return [...this._steps]; }
  public get status(): WorkflowStatus { return this._status; }

  public activate(): void { this._status = 'ACTIVE'; }
  public deactivate(): void { this._status = 'INACTIVE'; }
  public archive(): void { this._status = 'ARCHIVED'; }

  public addStep(step: WorkflowStep): void {
    this._steps.push(step);
    this._steps.sort((a, b) => a.order - b.order);
  }

  public removeStep(name: string): void {
    this._steps = this._steps.filter((s) => s.name !== name);
  }
}
