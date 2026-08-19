import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IMarketingCampaignRepository, MarketingCampaign } from '@afri-market/marketplace-domain';
import { ISmsService } from '@afri-market/integrations';
import { MARKETING_CAMPAIGN_REPOSITORY, SMS_SERVICE } from '../../tokens';

const MAX_AUDIENCE = 500;

@Injectable()
export class LaunchMarketingCampaignUseCase {
  constructor(
    @Inject(MARKETING_CAMPAIGN_REPOSITORY) private readonly campaignRepo: IMarketingCampaignRepository,
    @Inject(SMS_SERVICE) private readonly smsService: ISmsService,
  ) {}

  public async execute(
    tenantId: string,
    campaignId: string,
  ): Promise<{ campaignId: string; status: string; totalAudience: number; sentCount: number; failedCount: number }> {
    const campaign = await this.campaignRepo.findByIdAndTenant(campaignId, tenantId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException(`Only draft campaigns can be launched (current: ${campaign.status})`);
    }

    if (campaign.channel !== 'sms') {
      throw new BadRequestException(`Campaign channel "${campaign.channel}" is not configured yet; use SMS`);
    }

    if (campaign.isScheduled() && campaign.scheduledAt!.getTime() > Date.now()) {
      throw new BadRequestException(
        `Campaign is scheduled for ${campaign.scheduledAt!.toISOString()}; it will be dispatched automatically`,
      );
    }

    const phoneNumbers = await this.campaignRepo.findAudiencePhoneNumbers(tenantId, {
      limit: MAX_AUDIENCE,
      segment: campaign.segment,
    });
    campaign.launch(phoneNumbers.length);
    await this.campaignRepo.save(campaign);

    if (phoneNumbers.length === 0) {
      campaign.complete();
      await this.campaignRepo.save(campaign);
      return this.result(campaign);
    }

    for (const phone of phoneNumbers) {
      try {
        const result = await this.smsService.send({ to: phone, message: campaign.message, tenantId });
        campaign.recordResult(result.success);
      } catch {
        campaign.recordResult(false);
      }
    }

    campaign.complete();
    await this.campaignRepo.save(campaign);

    return this.result(campaign);
  }

  private result(campaign: MarketingCampaign) {
    return {
      campaignId: campaign.id.value,
      status: campaign.status,
      totalAudience: campaign.totalAudience,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
    };
  }
}