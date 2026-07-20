import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import {
  ComplianceCategory,
  ComplianceRecurrence,
  ComplianceRequirementCreatedEvent,
} from './events/compliance-requirement-created.event';
import { ComplianceRequirementDeactivatedEvent } from './events/compliance-requirement-deactivated.event';

export type { ComplianceCategory, ComplianceRecurrence } from './events/compliance-requirement-created.event';

interface CreateComplianceRequirementProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly description: string | null;
  readonly category: ComplianceCategory;
  readonly recurrence: ComplianceRecurrence;
}

interface ReconstituteComplianceRequirementProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly description: string | null;
  readonly category: ComplianceCategory;
  readonly recurrence: ComplianceRecurrence;
  readonly isActive: boolean;
}

// A tenant-defined requirement catalog entry that EmployeeComplianceRecord
// rows are assigned against — structurally the same shape as Course
// (@abms/hr-learning-domain, ADR-0015): create/deactivate only. Recurrence
// is descriptive metadata in v1 (e.g. informs how often a new assignment
// cycle should be created); no scheduler exists yet to auto-generate the
// next cycle's records — that is an explicit, documented v1 gap (ADR-0017).
export class ComplianceRequirement extends AggregateRoot<EntityId> {
  private _isActive: boolean;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _name: string,
    private readonly _description: string | null,
    private readonly _category: ComplianceCategory,
    private readonly _recurrence: ComplianceRecurrence,
    isActive: boolean,
  ) {
    super(id);
    this._isActive = isActive;
  }

  public static create(props: CreateComplianceRequirementProps): ComplianceRequirement {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));

    const requirement = new ComplianceRequirement(
      EntityId.create(),
      props.tenantId,
      props.name,
      props.description,
      props.category,
      props.recurrence,
      true,
    );
    requirement.addDomainEvent(
      new ComplianceRequirementCreatedEvent(
        requirement.id.toValue(),
        props.tenantId.value,
        props.category,
        props.recurrence,
      ),
    );
    return requirement;
  }

  public static reconstitute(props: ReconstituteComplianceRequirementProps): ComplianceRequirement {
    return new ComplianceRequirement(
      props.id,
      props.tenantId,
      props.name,
      props.description,
      props.category,
      props.recurrence,
      props.isActive,
    );
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleViolationException(`Compliance requirement "${this._name}" is already inactive.`);
    }
    this._isActive = false;
    this.addDomainEvent(new ComplianceRequirementDeactivatedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertActive(action: string): void {
    if (!this._isActive) {
      throw new BusinessRuleViolationException(`Cannot ${action}: compliance requirement "${this._name}" is inactive.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | null {
    return this._description;
  }

  public get category(): ComplianceCategory {
    return this._category;
  }

  public get recurrence(): ComplianceRecurrence {
    return this._recurrence;
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}
