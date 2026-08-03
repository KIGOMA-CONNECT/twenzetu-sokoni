import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { ComplianceRecordAssignedEvent } from './events/compliance-record-assigned.event';
import { ComplianceRecordMarkedCompliantEvent } from './events/compliance-record-marked-compliant.event';
import { ComplianceRecordMarkedExemptEvent } from './events/compliance-record-marked-exempt.event';
import { ComplianceRecordMarkedOverdueEvent } from './events/compliance-record-marked-overdue.event';

export type ComplianceRecordStatus = 'PENDING' | 'COMPLIANT' | 'OVERDUE' | 'EXEMPT';

interface AssignProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly complianceRequirementId: EntityId;
  readonly dueDate: Date;
}

interface ReconstituteEmployeeComplianceRecordProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly complianceRequirementId: EntityId;
  readonly dueDate: Date;
  readonly status: ComplianceRecordStatus;
  readonly completedDate: Date | null;
  readonly exemptionReason: string | null;
}

// Tracks one employee's compliance status against one ComplianceRequirement
// for one assignment cycle. Mirrors CourseEnrollment's enroll/complete/cancel
// shape (@abms/hr-learning-domain), but with a 3-way terminal outcome
// (COMPLIANT/OVERDUE/EXEMPT) instead of complete/cancel, since "reporting"
// on compliance posture requires distinguishing "did it" from "missed it"
// from "doesn't apply". Once terminal, a record is not reopened in v1 — a
// new cycle is a new assign() call, not a status reset (ADR-0017).
export class EmployeeComplianceRecord extends AggregateRoot<EntityId> {
  private _status: ComplianceRecordStatus;
  private _completedDate: Date | null;
  private _exemptionReason: string | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _complianceRequirementId: EntityId,
    private readonly _dueDate: Date,
    status: ComplianceRecordStatus,
    completedDate: Date | null,
    exemptionReason: string | null,
  ) {
    super(id);
    this._status = status;
    this._completedDate = completedDate;
    this._exemptionReason = exemptionReason;
  }

  public static assign(props: AssignProps): EmployeeComplianceRecord {
    const record = new EmployeeComplianceRecord(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.complianceRequirementId,
      props.dueDate,
      'PENDING',
      null,
      null,
    );
    record.addDomainEvent(
      new ComplianceRecordAssignedEvent(
        record.id.toValue(),
        props.tenantId.value,
        props.employeeId.toValue(),
        props.complianceRequirementId.toValue(),
      ),
    );
    return record;
  }

  public static reconstitute(props: ReconstituteEmployeeComplianceRecordProps): EmployeeComplianceRecord {
    return new EmployeeComplianceRecord(
      props.id,
      props.tenantId,
      props.employeeId,
      props.complianceRequirementId,
      props.dueDate,
      props.status,
      props.completedDate,
      props.exemptionReason,
    );
  }

  private assertPending(action: string): void {
    if (this._status !== 'PENDING') {
      throw new BusinessRuleViolationException(`Cannot ${action}: compliance record is already ${this._status}.`);
    }
  }

  public markCompliant(completedDate: Date): void {
    this.assertPending('mark compliant');
    this._status = 'COMPLIANT';
    this._completedDate = completedDate;
    this.addDomainEvent(
      new ComplianceRecordMarkedCompliantEvent(
        this.id.toValue(),
        this._tenantId.value,
        this._employeeId.toValue(),
        this._complianceRequirementId.toValue(),
      ),
    );
  }

  public markOverdue(): void {
    this.assertPending('mark overdue');
    this._status = 'OVERDUE';
    this.addDomainEvent(
      new ComplianceRecordMarkedOverdueEvent(
        this.id.toValue(),
        this._tenantId.value,
        this._employeeId.toValue(),
        this._complianceRequirementId.toValue(),
      ),
    );
  }

  public markExempt(reason: string): void {
    this.assertPending('mark exempt');
    Guard.assert(Guard.againstEmptyString(reason, 'reason'));
    this._status = 'EXEMPT';
    this._exemptionReason = reason;
    this.addDomainEvent(
      new ComplianceRecordMarkedExemptEvent(
        this.id.toValue(),
        this._tenantId.value,
        this._employeeId.toValue(),
        this._complianceRequirementId.toValue(),
      ),
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get complianceRequirementId(): EntityId {
    return this._complianceRequirementId;
  }

  public get dueDate(): Date {
    return this._dueDate;
  }

  public get status(): ComplianceRecordStatus {
    return this._status;
  }

  public get completedDate(): Date | null {
    return this._completedDate;
  }

  public get exemptionReason(): string | null {
    return this._exemptionReason;
  }
}
