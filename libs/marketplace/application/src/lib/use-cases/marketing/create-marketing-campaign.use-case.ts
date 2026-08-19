import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TenantId } from '@afri-market/kernel';
import { CampaignSegment, IMarketingCampaignRepository, MarketingCampaign } from '@afri-market/marketplace-domain';
import { MARKETING_CAMPAIGN_REPOSITORY } from '../../tokens';

export interface CreateMarketingCampaignInput {
  name: string;
  message: string;
  channel: 'sms' | 'whatsapp';
  scheduledAt?: string;
  segment?: CampaignSegment;
}

@Injectable()
export class CreateMarketingCampaignUseCase {
  constructor(
    @Inject(MARKETING_CAMPAIGN_REPOSITORY) private readonly campaignRepo: IMarketingCampaignRepository,
  ) {}

  public async execute(tenantId: string, input: CreateMarketingCampaignInput): Promise<{ campaignId: string }> {
    if (input.channel === 'whatsapp') {
      throw new BadRequestException('WhatsApp campaigns are not yet supported (provider not configured); use SMS');
    }
    const segment = this.normalizeSegment(input.segment);
    const campaign = MarketingCampaign.create({
      tenantId: TenantId.create(tenantId),
      name: input.name,
      message: input.message,
      channel: 'sms',
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      segment,
    });

    await this.campaignRepo.save(campaign);

    return { campaignId: campaign.id.value };
  }

  private normalizeSegment(segment?: CampaignSegment): CampaignSegment | undefined {
    if (!segment) return undefined;
    const minOrders = segment.minOrders !== undefined ? Math.floor(segment.minOrders) : undefined;
    const lastOrderWithinDays = segment.lastOrderWithinDays !== undefined ? Math.floor(segment.lastOrderWithinDays) : undefined;
    if ((minOrders !== undefined && minOrders > 0) || (lastOrderWithinDays !== undefined && lastOrderWithinDays > 0)) {
      return { minOrders: minOrders && minOrders > 0 ? minOrders : undefined, lastOrderWithinDays: lastOrderWithinDays && lastOrderWithinDays > 0 ? lastOrderWithinDays : undefined };
    }
    return undefined;
  }
}