import { Inject, Injectable } from '@nestjs/common';
import { TenantId } from '@afri-market/kernel';
import { IMarketingCampaignRepository, MarketingCampaign } from '@afri-market/marketplace-domain';
import { MARKETING_CAMPAIGN_REPOSITORY } from '../../tokens';

export interface CreateMarketingCampaignInput {
  name: string;
  message: string;
  channel: 'sms' | 'whatsapp';
  scheduledAt?: string;
}

@Injectable()
export class CreateMarketingCampaignUseCase {
  constructor(
    @Inject(MARKETING_CAMPAIGN_REPOSITORY) private readonly campaignRepo: IMarketingCampaignRepository,
  ) {}

  public async execute(tenantId: string, input: CreateMarketingCampaignInput): Promise<{ campaignId: string }> {
    if (input.channel === 'whatsapp') {
      throw new Error('WhatsApp campaigns are not yet supported; use SMS');
    }
    const campaign = MarketingCampaign.create({
      tenantId: TenantId.create(tenantId),
      name: input.name,
      message: input.message,
      channel: 'sms',
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    });

    await this.campaignRepo.save(campaign);

    return { campaignId: campaign.id.value };
  }
}