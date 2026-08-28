import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type FormLayoutType = 'GRID' | 'FLOW' | 'TABS' | 'STEPS' | 'SIDEBAR';

export interface FormSectionProps {
  readonly title: string;
  readonly fields: string[];
  readonly description?: string;
  readonly isCollapsible?: boolean;
  readonly isCollapsed?: boolean;
}

export interface FormMetadataProps {
  readonly entityType: string;
  readonly formName: string;
  readonly label: string;
  readonly description?: string;
  readonly layout?: FormLayoutType;
  readonly sections?: FormSectionProps[];
  readonly columns?: number;
  readonly submitLabel?: string;
  readonly cancelLabel?: string;
}

export class FormMetadata extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _entityType: string,
    private _formName: string,
    private _label: string,
    private _description: string | undefined,
    private _layout: FormLayoutType,
    private _sections: FormSectionProps[],
    private _columns: number,
    private _submitLabel: string,
    private _cancelLabel: string,
  ) {
    super(id);
  }

  public static define(props: FormMetadataProps): FormMetadata {
    Guard.assert(Guard.againstEmptyString(props.entityType, 'entityType'));
    Guard.assert(Guard.againstEmptyString(props.formName, 'formName'));
    Guard.assert(Guard.againstEmptyString(props.label, 'label'));

    return new FormMetadata(
      EntityId.create(),
      props.entityType,
      props.formName,
      props.label,
      props.description,
      props.layout ?? 'GRID',
      props.sections ?? [],
      props.columns ?? 1,
      props.submitLabel ?? 'Save',
      props.cancelLabel ?? 'Cancel',
    );
  }

  public get entityType(): string { return this._entityType; }
  public get formName(): string { return this._formName; }
  public get label(): string { return this._label; }
  public get description(): string | undefined { return this._description; }
  public get layout(): FormLayoutType { return this._layout; }
  public get sections(): FormSectionProps[] { return [...this._sections]; }
  public get columns(): number { return this._columns; }
  public get submitLabel(): string { return this._submitLabel; }
  public get cancelLabel(): string { return this._cancelLabel; }

  public addSection(section: FormSectionProps): void {
    this._sections.push(section);
  }

  public removeSection(title: string): void {
    this._sections = this._sections.filter((s) => s.title !== title);
  }

  public updateLayout(layout: FormLayoutType): void { this._layout = layout; }
  public updateColumns(columns: number): void { this._columns = columns; }
}
