import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';
import { PoiType, PoiSource } from './poi-type';

export interface CreateHyperlocalPoiProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly localName?: string;
  readonly description?: string;
  readonly type: PoiType;
  readonly latitude: number;
  readonly longitude: number;
  readonly streetAddress?: string;
  readonly landmarkDescription?: string;
  readonly submittedBy: EntityId;
  readonly source: PoiSource;
}

export interface ReconstituteHyperlocalPoiProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly localName: string | undefined;
  readonly description: string | undefined;
  readonly type: PoiType;
  readonly latitude: number;
  readonly longitude: number;
  readonly streetAddress: string | undefined;
  readonly landmarkDescription: string | undefined;
  readonly submittedBy: EntityId;
  readonly source: PoiSource;
  readonly verifiedBy: EntityId | undefined;
  readonly verificationCount: number;
  readonly isActive: boolean;
  readonly version: number;
}

export class HyperlocalPoi extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private _name: string,
    private _localName: string | undefined,
    private _description: string | undefined,
    private readonly _type: PoiType,
    private readonly _latitude: number,
    private readonly _longitude: number,
    private _streetAddress: string | undefined,
    private _landmarkDescription: string | undefined,
    private readonly _submittedBy: EntityId,
    private readonly _source: PoiSource,
    private _verifiedBy: EntityId | undefined,
    private _verificationCount: number,
    private _isActive: boolean,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateHyperlocalPoiProps): HyperlocalPoi {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new HyperlocalPoi(
      EntityId.create(), props.tenantId, props.name, props.localName,
      props.description, props.type, props.latitude, props.longitude,
      props.streetAddress, props.landmarkDescription, props.submittedBy,
      props.source, undefined, 0, true, 1,
    );
  }

  public static reconstitute(props: ReconstituteHyperlocalPoiProps): HyperlocalPoi {
    return new HyperlocalPoi(
      props.id, props.tenantId, props.name, props.localName,
      props.description, props.type, props.latitude, props.longitude,
      props.streetAddress, props.landmarkDescription, props.submittedBy,
      props.source, props.verifiedBy, props.verificationCount,
      props.isActive, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get name(): string { return this._name; }
  public get localName(): string | undefined { return this._localName; }
  public get description(): string | undefined { return this._description; }
  public get type(): PoiType { return this._type; }
  public get latitude(): number { return this._latitude; }
  public get longitude(): number { return this._longitude; }
  public get streetAddress(): string | undefined { return this._streetAddress; }
  public get landmarkDescription(): string | undefined { return this._landmarkDescription; }
  public get submittedBy(): EntityId { return this._submittedBy; }
  public get source(): PoiSource { return this._source; }
  public get verifiedBy(): EntityId | undefined { return this._verifiedBy; }
  public get verificationCount(): number { return this._verificationCount; }
  public get isActive(): boolean { return this._isActive; }
  public get version(): number { return this._version; }

  public verify(verifiedBy: EntityId): void {
    this._verifiedBy = verifiedBy;
    this._verificationCount += 1;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public incrementVerification(): void {
    this._verificationCount += 1;
  }
}
