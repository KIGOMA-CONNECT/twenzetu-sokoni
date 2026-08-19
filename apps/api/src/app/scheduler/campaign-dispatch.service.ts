import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IMarketingCampaignRepository,
} from '@afri-market/marketplace-domain';
import { LaunchMarketingCampaignUseCase } from '@afri-market/marketplace-application';
import { MARKETING_CAMPAIGN_REPOSITORY } from '@afri-market/marketplace-application';

@Injectable()
export class CampaignDispatchService {
  private readonly logger = new Logger(CampaignDispatchService.name);

  constructor(
    @Inject(MARKETING_CAMPAIGN_REPOSITORY) private readonly campaignRepo: IMarketingCampaignRepository,
    private readonly launchCampaign: LaunchMarketingCampaignUseCase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
  async dispatchDueCampaigns(): Promise<void> {
    let due;
    try {
      due = await this.campaignRepo.findDueScheduled(new Date());
    } catch (error: unknown) {
      this.logger.error(`Campaign dispatch: failed to query due campaigns: ${this.message(error)}`);
      return;
    }
    if (due.length === 0) {
      return;
    }
    this.logger.log(`Campaign dispatch: ${due.length} scheduled campaign(s) due`);
    for (const campaign of due) {
      try {
        await this.launchCampaign.execute(campaign.tenantId.value, campaign.id.value);
        this.logger.log(`Campaign dispatch: launched ${campaign.id.value} ("${campaign.name}")`);
      } catch (error: unknown) {
        this.logger.error(`Campaign dispatch: failed to launch ${campaign.id.value}: ${this.message(error)}`);
      }
    }
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}