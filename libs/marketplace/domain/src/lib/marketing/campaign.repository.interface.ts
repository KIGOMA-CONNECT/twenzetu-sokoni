import { EntityId, IRepository } from '@afri-market/kernel';
import { MarketingCampaign } from './campaign.aggregate';

export interface CampaignListResult {
  data: MarketingCampaign[];
  total: number;
}

export interface IMarketingCampaignRepository extends IRepository<MarketingCampaign, EntityId> {
  findByIdAndTenant(id: string, tenantId: string): Promise<MarketingCampaign | null>;
  findByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<CampaignListResult>;
  findAudiencePhoneNumbers(tenantId: string, limit?: number): Promise<string[]>;
}