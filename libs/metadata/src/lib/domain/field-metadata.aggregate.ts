import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'TIME'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'UUID'
  | 'JSON'
  | 'ENUM'
  | 'FILE'
  | 'IMAGE'
  | 'CURRENCY'
  | 'PERCENTAGE'
  | 'ADDRESS'
  | 'REFERENCE'
  | 'MULTI_SELECT'
  | 'RICH_TEXT';

export type FieldConstraint = 'REQUIRED' | 'UNIQUE' | 'READONLY' | 'HIDDEN' | 'MIN_LENGTH' | 'MAX_LENGTH' | 'MIN_VALUE' | 'MAX_VALUE' | 'PATTERN' | 'CUSTOM';

export interface FieldMetadataProps {
  readonly entityType: string;
  readonly fieldName: string;
  readonly fieldType: FieldType;
  readonly label: string;
  readonly description?: string;
  readonly isRequired?: boolean;
  readonly isUnique?: boolean;
  readonly isReadOnly?: boolean;
  readonly isHidden?: boolean;
  readonly defaultValue?: unknown;
  readonly options?: Array<{ label: string; value: string | number }>;
  readonly validation?: Array<{ constraint: FieldConstraint; parameters?: Record<string, unknown> }>;
  readonly order?: number;
  readonly group?: string;
}

export class FieldMetadata extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _entityType: string,
    private _fieldName: string,
    private _fieldType: FieldType,
    private _label: string,
    private _description: string | undefined,
    private _isRequired: boolean,
    private _isUnique: boolean,
    private _isReadOnly: boolean,
    private _isHidden: boolean,
    private _defaultValue: unknown,
    private _options: Array<{ label: string; value: string | number }>,
    private _validation: Array<{ constraint: FieldConstraint; parameters?: Record<string, unknown> }>,
    private _order: number,
    private _group: string | undefined,
  ) {
    super(id);
  }

  public static define(props: FieldMetadataProps): FieldMetadata {
    Guard.assert(Guard.againstEmptyString(props.entityType, 'entityType'));
    Guard.assert(Guard.againstEmptyString(props.fieldName, 'fieldName'));
    Guard.assert(Guard.againstEmptyString(props.label, 'label'));

    return new FieldMetadata(
      EntityId.create(),
      props.entityType,
      props.fieldName,
      props.fieldType,
      props.label,
      props.description,
      props.isRequired ?? false,
      props.isUnique ?? false,
      props.isReadOnly ?? false,
      props.isHidden ?? false,
      props.defaultValue,
      props.options ?? [],
      props.validation ?? [],
      props.order ?? 0,
      props.group,
    );
  }

  public static reconstitute(props: {
    id: EntityId;
    entityType: string;
    fieldName: string;
    fieldType: FieldType;
    label: string;
    description?: string;
    isRequired: boolean;
    isUnique: boolean;
    isReadOnly: boolean;
    isHidden: boolean;
    defaultValue?: unknown;
    options?: Array<{ label: string; value: string | number }>;
    validation?: Array<{ constraint: FieldConstraint; parameters?: Record<string, unknown> }>;
    order: number;
    group?: string;
  }): FieldMetadata {
    return new FieldMetadata(
      props.id,
      props.entityType,
      props.fieldName,
      props.fieldType,
      props.label,
      props.description,
      props.isRequired,
      props.isUnique,
      props.isReadOnly,
      props.isHidden,
      props.defaultValue,
      props.options ?? [],
      props.validation ?? [],
      props.order,
      props.group,
    );
  }

  public get entityType(): string { return this._entityType; }
  public get fieldName(): string { return this._fieldName; }
  public get fieldType(): FieldType { return this._fieldType; }
  public get label(): string { return this._label; }
  public get description(): string | undefined { return this._description; }
  public get isRequired(): boolean { return this._isRequired; }
  public get isUnique(): boolean { return this._isUnique; }
  public get isReadOnly(): boolean { return this._isReadOnly; }
  public get isHidden(): boolean { return this._isHidden; }
  public get defaultValue(): unknown { return this._defaultValue; }
  public get options(): Array<{ label: string; value: string | number }> { return [...this._options]; }
  public get validation(): Array<{ constraint: FieldConstraint; parameters?: Record<string, unknown> }> { return [...this._validation]; }
  public get order(): number { return this._order; }
  public get group(): string | undefined { return this._group; }

  public updateLabel(label: string): void {
    Guard.assert(Guard.againstEmptyString(label, 'label'));
    this._label = label;
  }

  public makeRequired(): void { this._isRequired = true; }
  public makeOptional(): void { this._isRequired = false; }
  public makeReadOnly(): void { this._isReadOnly = true; }
  public makeEditable(): void { this._isReadOnly = false; }
  public show(): void { this._isHidden = false; }
  public hide(): void { this._isHidden = true; }

  public setDefaultValue(value: unknown): void { this._defaultValue = value; }
  public setOrder(order: number): void { this._order = order; }
  public setGroup(group: string): void { this._group = group; }

  public addOption(label: string, value: string | number): void {
    this._options.push({ label, value });
  }

  public addValidation(constraint: FieldConstraint, parameters?: Record<string, unknown>): void {
    this._validation.push({ constraint, parameters });
  }
}
