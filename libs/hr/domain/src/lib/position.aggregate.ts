import { AggregateRoot, EntityId, Guard, TenantId } from '@abms/kernel';
import { PositionCreatedEvent } from './events/position-created.event';

interface CreatePositionProps {
  readonly tenantId: TenantId;
  readonly code: string;
  readonly title: string;
  readonly description?: string | null;
}

interface ReconstitutePositionProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly isActive: boolean;
}

export class Position extends AggregateRoot<EntityId> {
  private _title: string;
  private _description: string | null;
  private _isActive: boolean;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _code: string,
    title: string,
    description: string | null,
    isActive: boolean,
  ) {
    super(id);
    this._title = title;
    this._description = description;
    this._isActive = isActive;
  }

  public static create(props: CreatePositionProps): Position {
    Guard.assert(Guard.againstEmptyString(props.code, 'code'));
    Guard.assert(Guard.againstEmptyString(props.title, 'title'));

    const position = new Position(
      EntityId.create(),
      props.tenantId,
      props.code,
      props.title,
      props.description ?? null,
      true,
    );
    position.addDomainEvent(
      new PositionCreatedEvent(position.id.toValue(), props.tenantId.value, props.code),
    );
    return position;
  }

  public static reconstitute(props: ReconstitutePositionProps): Position {
    return new Position(
      props.id,
      props.tenantId,
      props.code,
      props.title,
      props.description,
      props.isActive,
    );
  }

  public rename(title: string): void {
    Guard.assert(Guard.againstEmptyString(title, 'title'));
    this._title = title;
  }

  public updateDescription(description: string | null): void {
    this._description = description;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public activate(): void {
    this._isActive = true;
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get code(): string {
    return this._code;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | null {
    return this._description;
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}
