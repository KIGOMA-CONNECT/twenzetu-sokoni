import { EntityId, IRepository } from '@afri-market/kernel';
import { CampaignSegment, MarketingCampaign } from './campaign.aggregate';

export interface CampaignListResult {
  data: MarketingCampaign[];
  total: number;
}

export interface CampaignAudienceQuery {
  limit?: number;
  segment?: CampaignSegment;
}

export interface CampaignRecipientRow {
  readonly phoneNumber: string;
  readonly variantIndex: number;
  readonly status: 'SENT' | 'FAILED';
}

// Per-variant delivery outcome for one campaign. `converted` counts distinct
// recipients who placed a DELIVERED order within the conversion window after
// their message was sent.
export interface CampaignVariantStat {
  readonly variantIndex: number;
  readonly sent: number;
  readonly failed: number;
  readonly converted: number;
}

export interface IMarketingCampaignRepository extends IRepository<MarketingCampaign, EntityId> {
  findByIdAndTenant(id: string, tenantId: string): Promise<MarketingCampaign | null>;
  findByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<CampaignListResult>;
  findAudiencePhoneNumbers(tenantId: string, opts?: CampaignAudienceQuery): Promise<string[]>;
  findDueScheduled(now: Date, opts?: { limit?: number }): Promise<MarketingCampaign[]>;
  saveRecipients(tenantId: string, campaignId: string, rows: CampaignRecipientRow[]): Promise<void>;
  getRecipientStats(campaignId: string, conversionWindowDays: number): Promise<CampaignVariantStat[]>;
}