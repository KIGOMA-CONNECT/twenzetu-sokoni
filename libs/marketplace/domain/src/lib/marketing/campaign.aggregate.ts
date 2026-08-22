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

// A single message variant used in A/B testing. When a campaign has
// testEnabled = true it must carry at least two variants; recipients are
// bucketed deterministically (hash of phone number) so results are stable.
export interface CampaignVariant {
  readonly index: number;
  readonly label?: string;
  readonly message: string;
}

export interface CreateCampaignProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly message: string;
  readonly channel: CampaignChannel;
  readonly scheduledAt?: Date;
  readonly segment?: CampaignSegment;
  readonly testEnabled?: boolean;
  readonly variants?: CampaignVariant[];
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
  readonly deliveredCount?: number;
  readonly clickCount?: number;
  readonly conversionCount?: number;
  readonly totalAudience: number;
  readonly scheduledAt: Date | undefined;
  readonly segment: CampaignSegment | undefined;
  readonly testEnabled?: boolean;
  readonly variants?: CampaignVariant[];
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
    private _deliveredCount: number,
    private _clickCount: number,
    private _conversionCount: number,
    private _totalAudience: number,
    private readonly _scheduledAt: Date | undefined,
    private readonly _segment: CampaignSegment | undefined,
    private readonly _testEnabled: boolean,
    private readonly _variants: CampaignVariant[],
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
    const variants = props.variants ?? [];
    if (props.testEnabled && variants.length < 2) {
      throw new Error('A/B campaigns require at least two message variants');
    }
    return new MarketingCampaign(
      EntityId.create(), props.tenantId, props.name, props.message,
      props.channel, 'DRAFT', 0, 0, 0, 0, 0, 0, props.scheduledAt, props.segment,
      props.testEnabled ?? false, variants, undefined, undefined,
    );
  }

  public static reconstitute(props: ReconstituteCampaignProps): MarketingCampaign {
    return new MarketingCampaign(
      props.id, props.tenantId, props.name, props.message,
      props.channel, props.status, props.sentCount, props.failedCount,
      props.deliveredCount ?? 0, props.clickCount ?? 0, props.conversionCount ?? 0,
      props.totalAudience, props.scheduledAt, props.segment,
      props.testEnabled ?? false, props.variants ?? [], props.startedAt, props.completedAt,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get name(): string { return this._name; }
  public get message(): string { return this._message; }
  public get channel(): CampaignChannel { return this._channel; }
  public get status(): CampaignStatus { return this._status; }
  public get sentCount(): number { return this._sentCount; }
  public get failedCount(): number { return this._failedCount; }
  public get deliveredCount(): number { return this._deliveredCount; }
  public get clickCount(): number { return this._clickCount; }
  public get conversionCount(): number { return this._conversionCount; }
  public get totalAudience(): number { return this._totalAudience; }
  public get scheduledAt(): Date | undefined { return this._scheduledAt; }
  public get segment(): CampaignSegment | undefined { return this._segment; }
  public get testEnabled(): boolean { return this._testEnabled; }
  public get variants(): CampaignVariant[] { return this._variants; }
  public get startedAt(): Date | undefined { return this._startedAt; }
  public get completedAt(): Date | undefined { return this._completedAt; }

  public isScheduled(): boolean {
    return !!this._scheduledAt;
  }

  // Resolves the message body to send to a recipient. For A/B campaigns the
  // bucket is chosen by a stable hash of the phone number so re-sends and
  // analytics stay consistent across runs.
  public messageForRecipient(phoneNumber: string): { message: string; variantIndex: number } {
    if (!this._testEnabled || this._variants.length < 2) {
      return { message: this._message, variantIndex: 0 };
    }
    const index = Math.abs(this.hashPhone(phoneNumber)) % this._variants.length;
    return { message: this._variants[index].message, variantIndex: index };
  }

  private hashPhone(phoneNumber: string): number {
    let hash = 0;
    for (let i = 0; i < phoneNumber.length; i++) {
      hash = (hash * 31 + phoneNumber.charCodeAt(i)) | 0;
    }
    return hash;
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

  public recordDelivery(): void {
    this._deliveredCount += 1;
  }

  public recordClick(): void {
    this._clickCount += 1;
  }

  public recordConversion(count: number = 1): void {
    this._conversionCount += count;
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
      deliveredCount: this._deliveredCount,
      clickCount: this._clickCount,
      conversionCount: this._conversionCount,
      totalAudience: this._totalAudience,
      scheduledAt: this._scheduledAt ?? null,
      segment: this._segment ?? null,
      testEnabled: this._testEnabled,
      variants: this._variants,
      startedAt: this._startedAt ?? null,
      completedAt: this._completedAt ?? null,
    };
  }
}