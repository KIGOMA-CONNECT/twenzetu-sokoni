import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';
import { KycStatus, PartnerType } from './kyc-status';

export interface CreatePartnerKycProps {
  readonly tenantId: TenantId;
  readonly partnerId: EntityId;
  readonly partnerType: PartnerType;
  readonly phoneNumber: string;
  readonly nidaNumber?: string;
  readonly tinNumber?: string;
  readonly licenseNumber?: string;
}

export interface ReconstitutePartnerKycProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly partnerId: EntityId;
  readonly partnerType: PartnerType;
  readonly phoneNumber: string;
  readonly status: KycStatus;
  readonly nidaNumber: string | undefined;
  readonly tinNumber: string | undefined;
  readonly licenseNumber: string | undefined;
  readonly nidaPhotoUrl: string | undefined;
  readonly selfiePhotoUrl: string | undefined;
  readonly faceMatchScore: number | undefined;
  readonly ocrExtractedData: Record<string, unknown> | undefined;
  readonly gpsLatitude: number | undefined;
  readonly gpsLongitude: number | undefined;
  readonly rejectionReason: string | undefined;
  readonly verifiedAt: Date | undefined;
  readonly version: number;
}

export class PartnerKyc extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _partnerId: EntityId,
    private readonly _partnerType: PartnerType,
    private readonly _phoneNumber: string,
    private _status: KycStatus,
    private _nidaNumber: string | undefined,
    private _tinNumber: string | undefined,
    private _licenseNumber: string | undefined,
    private _nidaPhotoUrl: string | undefined,
    private _selfiePhotoUrl: string | undefined,
    private _faceMatchScore: number | undefined,
    private _ocrExtractedData: Record<string, unknown> | undefined,
    private _gpsLatitude: number | undefined,
    private _gpsLongitude: number | undefined,
    private _rejectionReason: string | undefined,
    private _verifiedAt: Date | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreatePartnerKycProps): PartnerKyc {
    Guard.assert(Guard.againstEmptyString(props.phoneNumber, 'phoneNumber'));
    return new PartnerKyc(
      EntityId.create(), props.tenantId, props.partnerId, props.partnerType,
      props.phoneNumber, 'PENDING', props.nidaNumber, props.tinNumber,
      props.licenseNumber, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, 1,
    );
  }

  public static reconstitute(props: ReconstitutePartnerKycProps): PartnerKyc {
    return new PartnerKyc(
      props.id, props.tenantId, props.partnerId, props.partnerType,
      props.phoneNumber, props.status, props.nidaNumber, props.tinNumber,
      props.licenseNumber, props.nidaPhotoUrl, props.selfiePhotoUrl,
      props.faceMatchScore, props.ocrExtractedData, props.gpsLatitude,
      props.gpsLongitude, props.rejectionReason, props.verifiedAt, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get partnerId(): EntityId { return this._partnerId; }
  public get partnerType(): PartnerType { return this._partnerType; }
  public get phoneNumber(): string { return this._phoneNumber; }
  public get status(): KycStatus { return this._status; }
  public get nidaNumber(): string | undefined { return this._nidaNumber; }
  public get tinNumber(): string | undefined { return this._tinNumber; }
  public get licenseNumber(): string | undefined { return this._licenseNumber; }
  public get nidaPhotoUrl(): string | undefined { return this._nidaPhotoUrl; }
  public get selfiePhotoUrl(): string | undefined { return this._selfiePhotoUrl; }
  public get faceMatchScore(): number | undefined { return this._faceMatchScore; }
  public get ocrExtractedData(): Record<string, unknown> | undefined { return this._ocrExtractedData; }
  public get gpsLatitude(): number | undefined { return this._gpsLatitude; }
  public get gpsLongitude(): number | undefined { return this._gpsLongitude; }
  public get rejectionReason(): string | undefined { return this._rejectionReason; }
  public get verifiedAt(): Date | undefined { return this._verifiedAt; }
  public get version(): number { return this._version; }

  public uploadDocuments(nidaPhotoUrl: string, selfiePhotoUrl: string): void {
    this._nidaPhotoUrl = nidaPhotoUrl;
    this._selfiePhotoUrl = selfiePhotoUrl;
    this._status = 'DOCUMENTS_UPLOADED';
  }

  public startAiVerification(): void {
    this._status = 'AI_REVIEWING';
  }

  public completeOcrVerification(nidaNumber: string, ocrExtractedData: Record<string, unknown>): void {
    this._nidaNumber = nidaNumber;
    this._ocrExtractedData = ocrExtractedData;
  }

  public completeFaceLiveness(faceMatchScore: number): void {
    this._faceMatchScore = faceMatchScore;
  }

  public completeGpsVerification(latitude: number, longitude: number): void {
    this._gpsLatitude = latitude;
    this._gpsLongitude = longitude;
  }

  public approve(): void {
    this._status = 'APPROVED';
    this._verifiedAt = new Date();
  }

  public escalateToManualReview(): void {
    this._status = 'MANUAL_REVIEW';
  }

  public reject(reason: string): void {
    this._status = 'REJECTED';
    this._rejectionReason = reason;
  }
}
