import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type EntityCategory =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'PRODUCT'
  | 'SERVICE'
  | 'ASSET'
  | 'DOCUMENT'
  | 'TRANSACTION'
  | 'LOCATION'
  | 'FINANCIAL'
  | 'CUSTOM';

export type EntityState = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'MERGED';

export interface RegisterEntityProps {
  readonly entityType: string;
  readonly entityCategory: EntityCategory;
  readonly displayName: string;
  readonly tenantId: string;
  readonly attributes?: Record<string, unknown>;
  readonly tags?: string[];
  readonly parentEntityId?: string;
}

export interface ReconstituteEntityProps {
  readonly id: EntityId;
  readonly entityType: string;
  readonly entityCategory: EntityCategory;
  readonly displayName: string;
  readonly tenantId: string;
  readonly state: EntityState;
  readonly version: number;
  readonly attributes?: Record<string, unknown>;
  readonly tags?: string[];
  readonly parentEntityId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class RegisteredEntity extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _entityType: string,
    private readonly _entityCategory: EntityCategory,
    private _displayName: string,
    private readonly _tenantId: string,
    private _state: EntityState,
    private readonly _version: number,
    private _attributes: Record<string, unknown>,
    private _tags: string[],
    private readonly _parentEntityId: string | undefined,
  ) {
    super(id);
  }

  public static register(props: RegisterEntityProps): RegisteredEntity {
    Guard.assert(Guard.againstEmptyString(props.entityType, 'entityType'));
    Guard.assert(Guard.againstEmptyString(props.displayName, 'displayName'));
    Guard.assert(Guard.againstEmptyString(props.tenantId, 'tenantId'));

    return new RegisteredEntity(
      EntityId.create(),
      props.entityType,
      props.entityCategory,
      props.displayName,
      props.tenantId,
      'ACTIVE',
      1,
      props.attributes ?? {},
      props.tags ?? [],
      props.parentEntityId,
    );
  }

  public static reconstitute(props: ReconstituteEntityProps): RegisteredEntity {
    return new RegisteredEntity(
      props.id,
      props.entityType,
      props.entityCategory,
      props.displayName,
      props.tenantId,
      props.state,
      props.version,
      props.attributes ?? {},
      props.tags ?? [],
      props.parentEntityId,
    );
  }

  public get entityType(): string { return this._entityType; }
  public get entityCategory(): EntityCategory { return this._entityCategory; }
  public get displayName(): string { return this._displayName; }
  public get tenantId(): string { return this._tenantId; }
  public get state(): EntityState { return this._state; }
  public get version(): number { return this._version; }
  public get attributes(): Record<string, unknown> { return { ...this._attributes }; }
  public get tags(): string[] { return [...this._tags]; }
  public get parentEntityId(): string | undefined { return this._parentEntityId; }

  public updateDisplayName(name: string): void {
    Guard.assert(Guard.againstEmptyString(name, 'displayName'));
    this._displayName = name;
  }

  public setAttribute(key: string, value: unknown): void {
    this._attributes[key] = value;
  }

  public removeAttribute(key: string): void {
    delete this._attributes[key];
  }

  public addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
    }
  }

  public removeTag(tag: string): void {
    this._tags = this._tags.filter((t) => t !== tag);
  }

  public deactivate(): void { this._state = 'INACTIVE'; }
  public archive(): void { this._state = 'ARCHIVED'; }
  public activate(): void { this._state = 'ACTIVE'; }
}
