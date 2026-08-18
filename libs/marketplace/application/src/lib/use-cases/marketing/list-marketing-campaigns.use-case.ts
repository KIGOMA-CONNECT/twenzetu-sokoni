import { Inject, Injectable } from '@nestjs/common';
import { CampaignListResult, IMarketingCampaignRepository } from '@afri-market/marketplace-domain';
import { MARKETING_CAMPAIGN_REPOSITORY } from '../../tokens';

@Injectable()
export class ListMarketingCampaignsUseCase {
  constructor(
    @Inject(MARKETING_CAMPAIGN_REPOSITORY) private readonly campaignRepo: IMarketingCampaignRepository,
  ) {}

  public async execute(
    tenantId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<CampaignListResult> {
    return this.campaignRepo.findByTenant(tenantId, opts);
  }
}