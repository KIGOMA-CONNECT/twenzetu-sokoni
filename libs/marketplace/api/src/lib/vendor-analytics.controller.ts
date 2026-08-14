import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  AnalyticsService,
  resolveCustomRange,
  resolvePeriodRange,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('Vendor Analytics')
@Controller('vendor/analytics')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorAnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  private async resolveContext(user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'view_reports');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to view reports');
    }
    return ctx;
  }

  private resolveRange(dto: AnalyticsQueryDto) {
    try {
      if (dto.from || dto.to) {
        return resolveCustomRange(dto.from, dto.to);
      }
      return resolvePeriodRange(dto.period);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Get('overview')
  @ApiOperation({ summary: 'Tenant-facing analytics overview: sales summary, daily series, order funnel, customer acquisition and delivery performance (requires view_reports)' })
  public async overview(@Query() dto: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    const range = this.resolveRange(dto);
    const data = await this.analytics.overview(user.tenantId, ctx.vendorId, range);
    return { data: { ...data, shopName: ctx.shopName } };
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Best-selling products by revenue over a period (requires view_reports)' })
  public async topProducts(@Query() dto: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    const range = this.resolveRange(dto);
    const data = await this.analytics.topProducts(user.tenantId, ctx.vendorId, range, dto.limit ?? 10);
    return { data };
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory report with low-stock and out-of-stock products (requires view_reports)' })
  public async inventory(@Query() dto: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    const data = await this.analytics.inventory(user.tenantId, ctx.vendorId, dto.threshold ?? 5);
    return { data };
  }

  @Get('metric-catalog')
  @ApiOperation({ summary: 'The defined tenant-facing metric catalog (names, units, sources)' })
  public async metricCatalog() {
    const data = this.analytics.metricCatalog();
    return { data };
  }
}
