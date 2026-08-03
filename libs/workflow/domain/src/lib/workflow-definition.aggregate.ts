import { AggregateRoot, EntityId, Guard, TenantId } from '@abms/kernel';
import { WorkflowDefinitionCreatedEvent } from './events/workflow-definition-created.event';

// v1 scope: a single sequential, role-based approval chain. approverRole is a
// plain string, deliberately not typed against identity's UserRole enum —
// libs/workflow is foundation-tier and must not depend on the bounded-context
// identity module (which itself depends on workflow). See ADR-0007.
export interface WorkflowStepTemplate {
  readonly stepOrder: number;
  readonly approverRole: string;
}

interface CreateWorkflowDefinitionProps {
  readonly tenantId: TenantId;
  readonly code: string;
  readonly name: string;
  readonly approverRoles: readonly string[];
}

interface ReconstituteWorkflowDefinitionProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly code: string;
  readonly name: string;
  readonly steps: readonly WorkflowStepTemplate[];
  readonly isActive: boolean;
  readonly version: number;
}

export class WorkflowDefinition extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _steps: readonly WorkflowStepTemplate[],
    private readonly _isActive: boolean,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateWorkflowDefinitionProps): WorkflowDefinition {
    Guard.assert(Guard.againstEmptyString(props.code, 'code'));
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(Guard.inRange(props.approverRoles.length, 1, Number.MAX_SAFE_INTEGER, 'approverRoles'));
    props.approverRoles.forEach((role, index) =>
      Guard.assert(Guard.againstEmptyString(role, `approverRoles[${index}]`)),
    );

    const steps: WorkflowStepTemplate[] = props.approverRoles.map((approverRole, index) => ({
      stepOrder: index + 1,
      approverRole,
    }));

    const definition = new WorkflowDefinition(
      EntityId.create(),
      props.tenantId,
      props.code,
      props.name,
      steps,
      true,
      1,
    );
    definition.addDomainEvent(
      new WorkflowDefinitionCreatedEvent(definition.id.toValue(), props.tenantId.value, props.code),
    );
    return definition;
  }

  public static reconstitute(props: ReconstituteWorkflowDefinitionProps): WorkflowDefinition {
    return new WorkflowDefinition(
      props.id,
      props.tenantId,
      props.code,
      props.name,
      props.steps,
      props.isActive,
      props.version,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get steps(): readonly WorkflowStepTemplate[] {
    return this._steps;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get version(): number {
    return this._version;
  }
}
