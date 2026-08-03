import {
  AggregateRoot,
  BusinessRuleViolationException,
  EntityId,
  Guard,
  Money,
  TenantId,
} from '@abms/kernel';
import { SalaryStructureSetEvent } from './events/salary-structure-set.event';

export interface AllowanceLine {
  readonly name: string;
  readonly amount: Money;
}

interface SetSalaryStructureProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly basicSalary: Money;
  readonly allowances: readonly AllowanceLine[];
  readonly effectiveFrom: Date;
}

interface ReconstituteSalaryStructureProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly basicSalary: Money;
  readonly allowances: readonly AllowanceLine[];
  readonly effectiveFrom: Date;
  readonly isActive: boolean;
}

// One active structure per employee at a time — uniqueness enforced by the
// command handler (mirrors LeaveType's code-uniqueness check), not here,
// since it requires a repository lookup this aggregate can't perform.
export class SalaryStructure extends AggregateRoot<EntityId> {
  private _basicSalary: Money;
  private _allowances: readonly AllowanceLine[];
  private _isActive: boolean;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    basicSalary: Money,
    allowances: readonly AllowanceLine[],
    private readonly _effectiveFrom: Date,
    isActive: boolean,
  ) {
    super(id);
    this._basicSalary = basicSalary;
    this._allowances = allowances;
    this._isActive = isActive;
  }

  public static create(props: SetSalaryStructureProps): SalaryStructure {
    Guard.assert(Guard.againstNullOrUndefined(props.basicSalary, 'basicSalary'));
    SalaryStructure.assertAllowancesMatchCurrency(props.allowances, props.basicSalary);

    const structure = new SalaryStructure(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.basicSalary,
      props.allowances,
      props.effectiveFrom,
      true,
    );
    structure.addDomainEvent(
      new SalaryStructureSetEvent(
        structure.id.toValue(),
        props.tenantId.value,
        props.employeeId.toValue(),
      ),
    );
    return structure;
  }

  public static reconstitute(props: ReconstituteSalaryStructureProps): SalaryStructure {
    return new SalaryStructure(
      props.id,
      props.tenantId,
      props.employeeId,
      props.basicSalary,
      props.allowances,
      props.effectiveFrom,
      props.isActive,
    );
  }

  private static assertAllowancesMatchCurrency(
    allowances: readonly AllowanceLine[],
    basicSalary: Money,
  ): void {
    for (const allowance of allowances) {
      Guard.assert(Guard.againstEmptyString(allowance.name, 'allowance.name'));
      if (!allowance.amount.currency.equals(basicSalary.currency)) {
        throw new BusinessRuleViolationException(
          `Allowance "${allowance.name}" currency (${allowance.amount.currency.value}) must match basicSalary currency (${basicSalary.currency.value}).`,
        );
      }
    }
  }

  public updateBasicSalary(newBasicSalary: Money): void {
    if (!newBasicSalary.currency.equals(this._basicSalary.currency)) {
      throw new BusinessRuleViolationException(
        `New basicSalary currency (${newBasicSalary.currency.value}) must match the existing currency (${this._basicSalary.currency.value}).`,
      );
    }
    this._basicSalary = newBasicSalary;
  }

  public setAllowances(allowances: readonly AllowanceLine[]): void {
    SalaryStructure.assertAllowancesMatchCurrency(allowances, this._basicSalary);
    this._allowances = allowances;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public activate(): void {
    this._isActive = true;
  }

  public get grossMonthlySalary(): Money {
    return this._allowances.reduce(
      (total, allowance) => total.add(allowance.amount).getValue(),
      this._basicSalary,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get basicSalary(): Money {
    return this._basicSalary;
  }

  public get allowances(): readonly AllowanceLine[] {
    return this._allowances;
  }

  public get effectiveFrom(): Date {
    return this._effectiveFrom;
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}
