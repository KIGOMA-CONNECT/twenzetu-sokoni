import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import {
  GetAdminDashboardUseCase,
  GetAdminAnalyticsUseCase,
  ApproveVendorAdminUseCase,
  SuspendVendorAdminUseCase,
  ListAdminDisputesUseCase,
  ResolveDisputeAdminUseCase,
  ListPendingVendorsAdminUseCase,
  ListRecentOrdersAdminUseCase,
  GetFinanceSummaryAdminUseCase,
  GetRevenueReportUseCase,
  GetDisputeMetricsUseCase,
  VerifyKycUseCase,
} from '@afri-market/marketplace-application';
import { ResolveDisputeAdminDto, AnalyticsQueryDto, VerifyKycAdminDto, ListDisputesQueryDto, ListPendingVendorsQueryDto, ListRecentOrdersQueryDto } from './admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Throttle({ admin: { limit: 30, ttl: 60000 } })
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboard: GetAdminDashboardUseCase,
    private readonly analytics: GetAdminAnalyticsUseCase,
    private readonly approveVendor: ApproveVendorAdminUseCase,
    private readonly suspendVendor: SuspendVendorAdminUseCase,
    private readonly listDisputes: ListAdminDisputesUseCase,
    private readonly resolveDispute: ResolveDisputeAdminUseCase,
    private readonly listPendingVendors: ListPendingVendorsAdminUseCase,
    private readonly listRecentOrders: ListRecentOrdersAdminUseCase,
    private readonly financeSummary: GetFinanceSummaryAdminUseCase,
    private readonly getRevenue: GetRevenueReportUseCase,
    private readonly getDisputeMetrics: GetDisputeMetricsUseCase,
    private readonly verifyKyc: VerifyKycUseCase,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.dashboard.execute(user.tenantId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['24h', '7d', '30d', '90d'] })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalytics(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analytics.execute(user.tenantId, query.period);
  }

  @Patch('vendors/:id/approve')
  @ApiOperation({ summary: 'Approve a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor approved' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async approveVendorEndpoint(@Param('id', ParseUUIDPipe) id: string) {
    return this.approveVendor.execute(id);
  }

  @Patch('vendors/:id/suspend')
  @ApiOperation({ summary: 'Suspend a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor suspended' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async suspendVendorEndpoint(@Param('id', ParseUUIDPipe) id: string) {
    return this.suspendVendor.execute(id);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List all open disputes' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async listDisputesEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListDisputesQueryDto,
  ) {
    return this.listDisputes.execute(user.tenantId, { status: query.status, limit: query.limit, offset: query.offset });
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute as admin' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiBody({ type: ResolveDisputeAdminDto })
  @ApiResponse({ status: 200, description: 'Dispute resolved' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async resolveDisputeEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ResolveDisputeAdminDto,
  ) {
    return this.resolveDispute.execute(id, user.tenantId, dto);
  }

  @Get('vendors/pending')
  @ApiOperation({ summary: 'List vendors pending approval' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async listPendingVendorsEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPendingVendorsQueryDto,
  ) {
    return this.listPendingVendors.execute(user.tenantId, { limit: query.limit, offset: query.offset });
  }

  @Get('orders/recent')
  @ApiOperation({ summary: 'List recent orders' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async listRecentOrdersEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListRecentOrdersQueryDto,
  ) {
    return this.listRecentOrders.execute(user.tenantId, query.limit);
  }

  @Get('finance/summary')
  @ApiOperation({ summary: 'Get financial summary (commissions, payouts)' })
  @ApiQuery({ name: 'period', required: false, enum: ['this_month', 'last_month', 'all_time'] })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getFinanceSummaryEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query('period') period?: string,
  ) {
    return this.financeSummary.execute(user.tenantId, period);
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get detailed revenue report' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getRevenueReportEndpoint(@CurrentUser() user: JwtPayload) {
    return this.getRevenue.execute({ period: '7d', tenantId: user.tenantId });
  }

  @Get('analytics/disputes')
  @ApiOperation({ summary: 'Get dispute metrics' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getDisputeMetricsEndpoint(@CurrentUser() user: JwtPayload) {
    return this.getDisputeMetrics.execute(user.tenantId);
  }

  @Patch('kyc/:id/verify')
  @ApiOperation({ summary: 'Approve or reject a KYC submission' })
  @ApiParam({ name: 'id', description: 'KYC record ID' })
  @ApiBody({ type: VerifyKycAdminDto })
  @ApiResponse({ status: 200, description: 'KYC verified' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async verifyKycEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyKycAdminDto,
  ) {
    return this.verifyKyc.execute({ kycId: id, ...dto });
  }
}
