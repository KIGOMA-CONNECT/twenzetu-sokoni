import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type RelationshipType = 'IS_A' | 'HAS' | 'USES' | 'OWNS' | 'MANAGES' | 'BELONGS_TO' | 'DEPENDS_ON' | 'TRIGGERS' | 'CUSTOM';

export type RelationshipState = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';

export interface CreateRelationshipProps {
  readonly sourceEntityType: string;
  readonly targetEntityType: string;
  readonly relationshipType: RelationshipType;
  readonly label: string;
  readonly description?: string;
  readonly cardinality?: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  readonly properties?: Record<string, unknown>;
}

export interface ReconstituteRelationshipProps {
  readonly id: EntityId;
  readonly sourceEntityType: string;
  readonly targetEntityType: string;
  readonly relationshipType: RelationshipType;
  readonly label: string;
  readonly description?: string;
  readonly cardinality: string;
  readonly state: RelationshipState;
  readonly properties?: Record<string, unknown>;
}

export class EntityRelationship extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _sourceEntityType: string,
    private readonly _targetEntityType: string,
    private readonly _relationshipType: RelationshipType,
    private _label: string,
    private _description: string | undefined,
    private readonly _cardinality: string,
    private _state: RelationshipState,
    private _properties: Record<string, unknown>,
  ) {
    super(id);
  }

  public static define(props: CreateRelationshipProps): EntityRelationship {
    Guard.assert(Guard.againstEmptyString(props.sourceEntityType, 'sourceEntityType'));
    Guard.assert(Guard.againstEmptyString(props.targetEntityType, 'targetEntityType'));
    Guard.assert(Guard.againstEmptyString(props.label, 'label'));

    return new EntityRelationship(
      EntityId.create(),
      props.sourceEntityType,
      props.targetEntityType,
      props.relationshipType,
      props.label,
      props.description,
      props.cardinality ?? 'ONE_TO_MANY',
      'ACTIVE',
      props.properties ?? {},
    );
  }

  public static reconstitute(props: ReconstituteRelationshipProps): EntityRelationship {
    return new EntityRelationship(
      props.id,
      props.sourceEntityType,
      props.targetEntityType,
      props.relationshipType,
      props.label,
      props.description,
      props.cardinality,
      props.state,
      props.properties ?? {},
    );
  }

  public get sourceEntityType(): string { return this._sourceEntityType; }
  public get targetEntityType(): string { return this._targetEntityType; }
  public get relationshipType(): RelationshipType { return this._relationshipType; }
  public get label(): string { return this._label; }
  public get description(): string | undefined { return this._description; }
  public get cardinality(): string { return this._cardinality; }
  public get state(): RelationshipState { return this._state; }
  public get properties(): Record<string, unknown> { return { ...this._properties }; }

  public updateLabel(label: string): void {
    Guard.assert(Guard.againstEmptyString(label, 'label'));
    this._label = label;
  }

  public setProperty(key: string, value: unknown): void {
    this._properties[key] = value;
  }

  public deactivate(): void { this._state = 'INACTIVE'; }
  public activate(): void { this._state = 'ACTIVE'; }
  public deprecate(): void { this._state = 'DEPRECATED'; }
}
