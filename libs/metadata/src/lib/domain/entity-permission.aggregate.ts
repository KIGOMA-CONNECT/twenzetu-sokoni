import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT' | 'MANAGE';

export type PermissionScope = 'ALL' | 'OWN' | 'DEPARTMENT' | 'BRANCH' | 'COMPANY';

export interface EntityPermissionProps {
  readonly entityType: string;
  readonly role: string;
  readonly actions: PermissionAction[];
  readonly scope?: PermissionScope;
  readonly conditions?: Record<string, unknown>;
  readonly fields?: { readable?: string[]; writable?: string[] };
}

export class EntityPermission extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _entityType: string,
    private _role: string,
    private _actions: PermissionAction[],
    private _scope: PermissionScope,
    private _conditions: Record<string, unknown>,
    private _fields: { readable?: string[]; writable?: string[] },
  ) {
    super(id);
  }

  public static define(props: EntityPermissionProps): EntityPermission {
    Guard.assert(Guard.againstEmptyString(props.entityType, 'entityType'));
    Guard.assert(Guard.againstEmptyString(props.role, 'role'));

    return new EntityPermission(
      EntityId.create(),
      props.entityType,
      props.role,
      props.actions,
      props.scope ?? 'ALL',
      props.conditions ?? {},
      props.fields ?? {},
    );
  }

  public get entityType(): string { return this._entityType; }
  public get role(): string { return this._role; }
  public get actions(): PermissionAction[] { return [...this._actions]; }
  public get scope(): PermissionScope { return this._scope; }
  public get conditions(): Record<string, unknown> { return { ...this._conditions }; }
  public get fields(): { readable?: string[]; writable?: string[] } { return { ...this._fields }; }

  public addAction(action: PermissionAction): void {
    if (!this._actions.includes(action)) {
      this._actions.push(action);
    }
  }

  public removeAction(action: PermissionAction): void {
    this._actions = this._actions.filter((a) => a !== action);
  }

  public updateScope(scope: PermissionScope): void { this._scope = scope; }
  public updateConditions(conditions: Record<string, unknown>): void { this._conditions = conditions; }
  public updateFields(fields: { readable?: string[]; writable?: string[] }): void { this._fields = fields; }
}
