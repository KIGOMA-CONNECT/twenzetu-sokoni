import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TenantId } from '@afri-market/kernel';
import { CampaignSegment, CampaignVariant, IMarketingCampaignRepository, MarketingCampaign } from '@afri-market/marketplace-domain';
import { MARKETING_CAMPAIGN_REPOSITORY } from '../../tokens';

export interface CreateCampaignVariantInput {
  label?: string;
  message: string;
}

export interface CreateMarketingCampaignInput {
  name: string;
  message: string;
  channel: 'sms' | 'whatsapp';
  scheduledAt?: string;
  segment?: CampaignSegment;
  testEnabled?: boolean;
  variants?: CreateCampaignVariantInput[];
}

const MAX_VARIANTS = 4;

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
    const variants = this.normalizeVariants(input.variants);
    const testEnabled = input.testEnabled === true;
    if (testEnabled && variants.length < 2) {
      throw new BadRequestException('A/B campaigns require at least two message variants');
    }
    const campaign = MarketingCampaign.create({
      tenantId: TenantId.create(tenantId),
      name: input.name,
      message: input.message,
      channel: 'sms',
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      segment,
      testEnabled,
      variants: testEnabled ? variants : [],
    });

    await this.campaignRepo.save(campaign);

    return { campaignId: campaign.id.value };
  }

  private normalizeVariants(variants?: CreateCampaignVariantInput[]): CampaignVariant[] {
    if (!variants || variants.length === 0) return [];
    if (variants.length > MAX_VARIANTS) {
      throw new BadRequestException(`A campaign supports at most ${MAX_VARIANTS} variants`);
    }
    return variants.map((v, index) => {
      const message = (v.message ?? '').trim();
      if (!message) throw new BadRequestException(`Variant ${index + 1} has an empty message`);
      return { index, label: v.label?.trim() || `Variant ${String.fromCharCode(65 + index)}`, message };
    });
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