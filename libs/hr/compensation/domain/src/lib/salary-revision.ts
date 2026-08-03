import { EntityId, Guard, Money, TenantId } from '@abms/kernel';

export type SalaryRevisionReason =
  | 'MERIT_INCREASE'
  | 'PROMOTION'
  | 'MARKET_ADJUSTMENT'
  | 'COST_OF_LIVING_ADJUSTMENT'
  | 'DEMOTION'
  | 'OTHER';

interface RecordSalaryRevisionProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly reason: SalaryRevisionReason;
  readonly previousBasicSalary: Money;
  readonly newBasicSalary: Money;
  readonly effectiveDate: Date;
}

interface ReconstituteSalaryRevisionProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly reason: SalaryRevisionReason;
  readonly previousBasicSalary: Money;
  readonly newBasicSalary: Money;
  readonly effectiveDate: Date;
}

// Deliberately not an AggregateRoot: it has no mutators and emits no domain
// events of its own — it *is* the durable, insert-only (WORM) record of a
// SalaryStructure.updateBasicSalary() mutation, written by
// RecordSalaryRevisionHandler alongside that mutation. Mirrors
// EmploymentHistoryEntry (@abms/hr-domain, ADR-0008) but scoped to
// compensation rather than the general employment timeline. See ADR-0014.
export class SalaryRevision {
  private constructor(
    public readonly id: EntityId,
    public readonly tenantId: TenantId,
    public readonly employeeId: EntityId,
    public readonly reason: SalaryRevisionReason,
    public readonly previousBasicSalary: Money,
    public readonly newBasicSalary: Money,
    public readonly effectiveDate: Date,
  ) {}

  public static record(props: RecordSalaryRevisionProps): SalaryRevision {
    Guard.assert(Guard.againstNullOrUndefined(props.effectiveDate, 'effectiveDate'));
    if (!props.newBasicSalary.currency.equals(props.previousBasicSalary.currency)) {
      throw new Error(
        `newBasicSalary currency (${props.newBasicSalary.currency.value}) must match previousBasicSalary currency (${props.previousBasicSalary.currency.value}).`,
      );
    }

    return new SalaryRevision(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.reason,
      props.previousBasicSalary,
      props.newBasicSalary,
      props.effectiveDate,
    );
  }

  public static reconstitute(props: ReconstituteSalaryRevisionProps): SalaryRevision {
    return new SalaryRevision(
      props.id,
      props.tenantId,
      props.employeeId,
      props.reason,
      props.previousBasicSalary,
      props.newBasicSalary,
      props.effectiveDate,
    );
  }
}
