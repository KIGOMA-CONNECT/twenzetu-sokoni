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

export interface IMarketingCampaignRepository extends IRepository<MarketingCampaign, EntityId> {
  findByIdAndTenant(id: string, tenantId: string): Promise<MarketingCampaign | null>;
  findByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<CampaignListResult>;
  findAudiencePhoneNumbers(tenantId: string, opts?: CampaignAudienceQuery): Promise<string[]>;
  findDueScheduled(now: Date, opts?: { limit?: number }): Promise<MarketingCampaign[]>;
}