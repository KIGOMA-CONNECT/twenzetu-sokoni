import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateMarketingCampaignUseCase, GetCampaignAnalyticsUseCase, ListMarketingCampaignsUseCase, LaunchMarketingCampaignUseCase } from '@afri-market/marketplace-application';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Marketing Campaigns')
@Controller('marketing/campaigns')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MarketingCampaignsController {
  constructor(
    private readonly createCampaign: CreateMarketingCampaignUseCase,
    private readonly listCampaigns: ListMarketingCampaignsUseCase,
    private readonly launchCampaign: LaunchMarketingCampaignUseCase,
    private readonly campaignAnalytics: GetCampaignAnalyticsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a marketing campaign (DRAFT)' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateMarketingCampaignDto, @CurrentUser() user: JwtPayload) {
    return this.createCampaign.execute(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List marketing campaigns for a tenant' })
  @ApiResponse({ status: 200, description: 'Campaigns' })
  public async findAll(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const p = parsePagination({ limit, offset });
    const result = await this.listCampaigns.execute(user.tenantId, p);
    return paginatedResult(result.data.map((c) => c.toDto()), result.total, p.limit, p.offset);
  }

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch a DRAFT campaign (sends SMS to customer audience)' })
  @ApiResponse({ status: 200, description: 'Campaign launched' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  public async launch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.launchCampaign.execute(user.tenantId, id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Delivery + A/B variant analytics for a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign analytics' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  public async analytics(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaignAnalytics.execute(user.tenantId, id);
  }
}