import { EntityId, Guard, TenantId } from '@abms/kernel';

export type EmploymentEventType =
  | 'HIRED'
  | 'POSITION_CHANGED'
  | 'TRANSFERRED'
  | 'SUSPENDED'
  | 'REACTIVATED'
  | 'TERMINATED';

interface CreateEmploymentHistoryEntryProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly eventType: EmploymentEventType;
  readonly effectiveDate: Date;
  readonly details: string | null;
}

interface ReconstituteEmploymentHistoryEntryProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly eventType: EmploymentEventType;
  readonly effectiveDate: Date;
  readonly details: string | null;
}

// Deliberately not an AggregateRoot: it has no mutators and emits no domain
// events of its own — it *is* the durable record of an Employee's domain
// events, written by handlers alongside each Employee mutation, insert-only
// (WORM), mirroring libs/audit's audit_log but HR-domain-specific rather
// than a generic technical command log. See ADR-0008.
export class EmploymentHistoryEntry {
  private constructor(
    public readonly id: EntityId,
    public readonly tenantId: TenantId,
    public readonly employeeId: EntityId,
    public readonly eventType: EmploymentEventType,
    public readonly effectiveDate: Date,
    public readonly details: string | null,
  ) {}

  public static create(props: CreateEmploymentHistoryEntryProps): EmploymentHistoryEntry {
    Guard.assert(Guard.againstNullOrUndefined(props.effectiveDate, 'effectiveDate'));

    return new EmploymentHistoryEntry(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.eventType,
      props.effectiveDate,
      props.details,
    );
  }

  public static reconstitute(props: ReconstituteEmploymentHistoryEntryProps): EmploymentHistoryEntry {
    return new EmploymentHistoryEntry(
      props.id,
      props.tenantId,
      props.employeeId,
      props.eventType,
      props.effectiveDate,
      props.details,
    );
  }
}
