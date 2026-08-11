import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateAdvertProps {
  readonly tenantId: TenantId;
  readonly title: string;
  readonly body?: string;
  readonly emoji?: string;
  readonly imageUrl?: string;
  readonly ctaLabel?: string;
  readonly ctaUrl?: string;
  readonly sortOrder?: number;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
}

export interface ReconstituteAdvertProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly title: string;
  readonly body: string | undefined;
  readonly emoji: string | undefined;
  readonly imageUrl: string | undefined;
  readonly ctaLabel: string | undefined;
  readonly ctaUrl: string | undefined;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly startsAt: Date | undefined;
  readonly endsAt: Date | undefined;
}

export class Advert extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private _title: string,
    private _body: string | undefined,
    private _emoji: string | undefined,
    private _imageUrl: string | undefined,
    private _ctaLabel: string | undefined,
    private _ctaUrl: string | undefined,
    private _isActive: boolean,
    private _sortOrder: number,
    private readonly _startsAt: Date | undefined,
    private readonly _endsAt: Date | undefined,
  ) {
    super(id);
  }

  public static create(props: CreateAdvertProps): Advert {
    Guard.assert(Guard.againstEmptyString(props.title, 'title'));
    return new Advert(
      EntityId.create(), props.tenantId, props.title, props.body,
      props.emoji, props.imageUrl, props.ctaLabel, props.ctaUrl,
      true, props.sortOrder ?? 0, props.startsAt, props.endsAt,
    );
  }

  public static reconstitute(props: ReconstituteAdvertProps): Advert {
    return new Advert(
      props.id, props.tenantId, props.title, props.body,
      props.emoji, props.imageUrl, props.ctaLabel, props.ctaUrl,
      props.isActive, props.sortOrder, props.startsAt, props.endsAt,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get title(): string { return this._title; }
  public get body(): string | undefined { return this._body; }
  public get emoji(): string | undefined { return this._emoji; }
  public get imageUrl(): string | undefined { return this._imageUrl; }
  public get ctaLabel(): string | undefined { return this._ctaLabel; }
  public get ctaUrl(): string | undefined { return this._ctaUrl; }
  public get isActive(): boolean { return this._isActive; }
  public get sortOrder(): number { return this._sortOrder; }
  public get startsAt(): Date | undefined { return this._startsAt; }
  public get endsAt(): Date | undefined { return this._endsAt; }

  public deactivate(): void { this._isActive = false; }
  public activate(): void { this._isActive = true; }
  public reorder(sortOrder: number): void { this._sortOrder = sortOrder; }

  public isCurrentlyActive(now: Date = new Date()): boolean {
    if (!this._isActive) return false;
    if (this._startsAt && this._startsAt > now) return false;
    if (this._endsAt && this._endsAt < now) return false;
    return true;
  }

  public toDto() {
    return {
      id: this.id.value,
      title: this._title,
      body: this._body ?? null,
      emoji: this._emoji ?? null,
      imageUrl: this._imageUrl ?? null,
      ctaLabel: this._ctaLabel ?? null,
      ctaUrl: this._ctaUrl ?? null,
      isActive: this._isActive,
      sortOrder: this._sortOrder,
      startsAt: this._startsAt ?? null,
      endsAt: this._endsAt ?? null,
    };
  }
}
