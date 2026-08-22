import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IMarketingCampaignRepository } from '@afri-market/marketplace-domain';
import { MARKETING_CAMPAIGN_REPOSITORY } from '../../tokens';

// Number of days after a message is sent during which a recipient placing a
// DELIVERED order counts as a conversion attributed to the campaign.
const CONVERSION_WINDOW_DAYS = 7;

export interface CampaignVariantAnalytics {
  variantIndex: number;
  label: string;
  sent: number;
  failed: number;
  converted: number;
  conversionRate: number;
  winner: boolean;
}

export interface CampaignAnalyticsResult {
  campaignId: string;
  name: string;
  status: string;
  testEnabled: boolean;
  totalAudience: number;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;
  conversionCount: number;
  conversionRate: number;
  deliveryRate: number;
  winningVariantIndex: number | null;
  variants: CampaignVariantAnalytics[];
}

@Injectable()
export class GetCampaignAnalyticsUseCase {
  constructor(
    @Inject(MARKETING_CAMPAIGN_REPOSITORY) private readonly campaignRepo: IMarketingCampaignRepository,
  ) {}

  public async execute(tenantId: string, campaignId: string): Promise<CampaignAnalyticsResult> {
    const campaign = await this.campaignRepo.findByIdAndTenant(campaignId, tenantId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    const stats = await this.campaignRepo.getRecipientStats(campaignId, CONVERSION_WINDOW_DAYS);

    const totalConverted = stats.reduce((sum, s) => sum + s.converted, 0);
    const totalSent = stats.reduce((sum, s) => sum + s.sent, 0);

    // Winner = variant with the highest conversion rate among variants that
    // actually reached someone; ties go to the earlier variant.
    let winningIndex: number | null = null;
    let bestRate = -1;
    for (const s of stats) {
      if (s.sent <= 0) continue;
      const rate = s.converted / s.sent;
      if (rate > bestRate) {
        bestRate = rate;
        winningIndex = s.variantIndex;
      }
    }

    const variants: CampaignVariantAnalytics[] = stats.map((s) => ({
      variantIndex: s.variantIndex,
      label: campaign.variants[s.variantIndex]?.label ?? 'Message',
      sent: s.sent,
      failed: s.failed,
      converted: s.converted,
      conversionRate: s.sent > 0 ? this.round(s.converted / s.sent) : 0,
      winner: stats.length > 1 && s.variantIndex === winningIndex && bestRate > 0,
    }));

    return {
      campaignId: campaign.id.value,
      name: campaign.name,
      status: campaign.status,
      testEnabled: campaign.testEnabled,
      totalAudience: campaign.totalAudience,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      deliveredCount: campaign.deliveredCount,
      conversionCount: totalConverted || campaign.conversionCount,
      conversionRate: totalSent > 0 ? this.round(totalConverted / totalSent) : 0,
      deliveryRate: campaign.totalAudience > 0 ? this.round(campaign.deliveredCount / campaign.totalAudience) : 0,
      winningVariantIndex: winningIndex,
      variants,
    };
  }

  private round(value: number): number {
    return Math.round(value * 10000) / 10000;
  }
}
