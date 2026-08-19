import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export type CampaignChannel = 'sms' | 'whatsapp';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Audience segmentation criteria for a campaign. When present, the audience
// query filters ACTIVE customers by order behaviour instead of broadcasting
// to the whole tenant customer base.
export interface CampaignSegment {
  readonly minOrders?: number;
  readonly lastOrderWithinDays?: number;
}

export interface CreateCampaignProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly message: string;
  readonly channel: CampaignChannel;
  readonly scheduledAt?: Date;
  readonly segment?: CampaignSegment;
}

export interface ReconstituteCampaignProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly message: string;
  readonly channel: CampaignChannel;
  readonly status: CampaignStatus;
  readonly sentCount: number;
  readonly failedCount: number;
  readonly totalAudience: number;
  readonly scheduledAt: Date | undefined;
  readonly segment: CampaignSegment | undefined;
  readonly startedAt: Date | undefined;
  readonly completedAt: Date | undefined;
  readonly version: number;
}

export class MarketingCampaign extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private _name: string,
    private _message: string,
    private readonly _channel: CampaignChannel,
    private _status: CampaignStatus,
    private _sentCount: number,
    private _failedCount: number,
    private _totalAudience: number,
    private readonly _scheduledAt: Date | undefined,
    private readonly _segment: CampaignSegment | undefined,
    private _startedAt: Date | undefined,
    private _completedAt: Date | undefined,
  ) {
    super(id);
  }

  public static create(props: CreateCampaignProps): MarketingCampaign {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(Guard.againstEmptyString(props.message, 'message'));
    if (props.channel !== 'sms' && props.channel !== 'whatsapp') {
      throw new Error('Campaign channel must be sms or whatsapp');
    }
    return new MarketingCampaign(
      EntityId.create(), props.tenantId, props.name, props.message,
      props.channel, 'DRAFT', 0, 0, 0, props.scheduledAt, props.segment, undefined, undefined,
    );
  }

  public static reconstitute(props: ReconstituteCampaignProps): MarketingCampaign {
    return new MarketingCampaign(
      props.id, props.tenantId, props.name, props.message,
      props.channel, props.status, props.sentCount, props.failedCount,
      props.totalAudience, props.scheduledAt, props.segment, props.startedAt, props.completedAt,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get name(): string { return this._name; }
  public get message(): string { return this._message; }
  public get channel(): CampaignChannel { return this._channel; }
  public get status(): CampaignStatus { return this._status; }
  public get sentCount(): number { return this._sentCount; }
  public get failedCount(): number { return this._failedCount; }
  public get totalAudience(): number { return this._totalAudience; }
  public get scheduledAt(): Date | undefined { return this._scheduledAt; }
  public get segment(): CampaignSegment | undefined { return this._segment; }
  public get startedAt(): Date | undefined { return this._startedAt; }
  public get completedAt(): Date | undefined { return this._completedAt; }

  public isScheduled(): boolean {
    return !!this._scheduledAt;
  }

  public launch(totalAudience: number, now: Date = new Date()): void {
    if (this._status !== 'DRAFT') {
      throw new Error(`Cannot launch a campaign in status ${this._status}`);
    }
    this._status = 'ACTIVE';
    this._totalAudience = totalAudience;
    this._startedAt = now;
  }

  public recordResult(success: boolean): void {
    if (success) this._sentCount += 1;
    else this._failedCount += 1;
  }

  public complete(now: Date = new Date()): void {
    this._status = 'COMPLETED';
    this._completedAt = now;
  }

  public markFailed(): void {
    this._status = 'FAILED';
  }

  public cancel(): void {
    if (this._status !== 'DRAFT') {
      throw new Error(`Cannot cancel a campaign in status ${this._status}`);
    }
    this._status = 'CANCELLED';
  }

  public toDto() {
    return {
      id: this.id.value,
      name: this._name,
      message: this._message,
      channel: this._channel,
      status: this._status,
      sentCount: this._sentCount,
      failedCount: this._failedCount,
      totalAudience: this._totalAudience,
      scheduledAt: this._scheduledAt ?? null,
      segment: this._segment ?? null,
      startedAt: this._startedAt ?? null,
      completedAt: this._completedAt ?? null,
    };
  }
}