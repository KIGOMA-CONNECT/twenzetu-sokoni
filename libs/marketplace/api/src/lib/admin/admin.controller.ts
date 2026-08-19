import {
  BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard, RequirePermissions, PermissionsGuard } from '@afri-market/identity-infrastructure';
import {
  AnalyticsService,
  resolveCustomRange,
  resolvePeriodRange,
  GetAdminDashboardUseCase,
  GetAdminAnalyticsUseCase,
  ApproveVendorAdminUseCase,
  SuspendVendorAdminUseCase,
  ListAdminDisputesUseCase,
  ResolveDisputeAdminUseCase,
  ListPendingVendorsAdminUseCase,
  ListAllVendorsAdminUseCase,
  ListRecentOrdersAdminUseCase,
  GetFinanceSummaryAdminUseCase,
  GetRevenueReportUseCase,
  GetDisputeMetricsUseCase,
  VerifyKycUseCase,
  GetReconciliationReportUseCase,
} from '@afri-market/marketplace-application';
import { AuditLogService } from '../audit-log.service';
import { ResolveDisputeAdminDto, AnalyticsQueryDto, VerifyKycAdminDto, ListDisputesQueryDto, ListPendingVendorsQueryDto, ListRecentOrdersQueryDto } from './admin.dto';
import { AnalyticsQueryDto as ReportQueryDto } from '../dto/analytics-query.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
@Roles('admin')
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboard: GetAdminDashboardUseCase,
    private readonly analytics: GetAdminAnalyticsUseCase,
    private readonly analyticsService: AnalyticsService,
    private readonly approveVendor: ApproveVendorAdminUseCase,
    private readonly suspendVendor: SuspendVendorAdminUseCase,
    private readonly listDisputes: ListAdminDisputesUseCase,
    private readonly resolveDispute: ResolveDisputeAdminUseCase,
    private readonly listPendingVendors: ListPendingVendorsAdminUseCase,
    private readonly listAllVendors: ListAllVendorsAdminUseCase,
    private readonly listRecentOrders: ListRecentOrdersAdminUseCase,
    private readonly financeSummary: GetFinanceSummaryAdminUseCase,
    private readonly getRevenue: GetRevenueReportUseCase,
    private readonly getDisputeMetrics: GetDisputeMetricsUseCase,
    private readonly verifyKyc: VerifyKycUseCase,
    private readonly reconciliation: GetReconciliationReportUseCase,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.dashboard.execute(user.tenantId);
  }

  @Get('analytics')
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['24h', '7d', '30d', '90d'] })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalytics(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analytics.execute(user.tenantId, query.period);
  }

  private resolveReportRange(dto: ReportQueryDto) {
    try {
      if (dto.from || dto.to) {
        return resolveCustomRange(dto.from, dto.to);
      }
      return resolvePeriodRange(dto.period);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Get('analytics/overview')
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'Tenant-wide analytics overview: sales summary, daily series, order funnel, customer acquisition and delivery performance (requires view_analytics)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalyticsOverview(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    const range = this.resolveReportRange(query);
    const data = await this.analyticsService.overview(user.tenantId, undefined, range);
    return { data };
  }

  @Get('analytics/top-products')
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'Best-selling products across the tenant by revenue (requires view_analytics)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalyticsTopProducts(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    const range = this.resolveReportRange(query);
    const data = await this.analyticsService.topProducts(user.tenantId, undefined, range, query.limit ?? 10);
    return { data };
  }

  @Get('analytics/inventory')
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'Tenant-wide inventory report with low-stock and out-of-stock products (requires view_analytics)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalyticsInventory(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    const data = await this.analyticsService.inventory(user.tenantId, undefined, query.threshold ?? 5);
    return { data };
  }

  @Get('analytics/metric-catalog')
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'The defined metric catalog for platform reporting (names, units, sources)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalyticsMetricCatalog() {
    const data = this.analyticsService.metricCatalog();
    return { data };
  }

  @Get('analytics/delivery-sla')
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'Tenant-wide delivery SLA: on-time rate vs estimated ETA, average distance and actual duration (requires view_analytics)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalyticsDeliverySla(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    const range = this.resolveReportRange(query);
    const data = await this.analyticsService.deliverySla(user.tenantId, undefined, range);
    return { data };
  }

  @Get('analytics/delivery-sla/drivers')
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'Per-driver delivery SLA performance (requires view_analytics)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getAnalyticsDeliverySlaDrivers(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    const range = this.resolveReportRange(query);
    const data = await this.analyticsService.deliverySlaByDriver(user.tenantId, undefined, range, query.limit ?? 25);
    return { data };
  }

  @Patch('vendors/:id/approve')
  @RequirePermissions('manage_vendors')
  @ApiOperation({ summary: 'Approve a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor approved' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async approveVendorEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.approveVendor.execute(id);
    await this.auditLog.log({
      action: 'vendor.approved',
      actorId: user.sub,
      actorRole: 'admin',
      tenantId: user.tenantId,
      targetType: 'vendor',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch('vendors/:id/suspend')
  @RequirePermissions('manage_vendors')
  @ApiOperation({ summary: 'Suspend a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor suspended' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async suspendVendorEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.suspendVendor.execute(id);
    await this.auditLog.log({
      action: 'vendor.suspended',
      actorId: user.sub,
      actorRole: 'admin',
      tenantId: user.tenantId,
      targetType: 'vendor',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('disputes')
  @RequirePermissions('manage_disputes')
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
  @RequirePermissions('manage_disputes')
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

  @Get('vendors')
  @RequirePermissions('manage_vendors')
  @ApiOperation({ summary: 'List all vendors' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async listAllVendorsEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPendingVendorsQueryDto,
  ) {
    return this.listAllVendors.execute(user.tenantId, { limit: query.limit, offset: query.offset });
  }

  @Get('vendors/pending')
  @RequirePermissions('manage_vendors')
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
  @RequirePermissions('manage_orders')
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
  @RequirePermissions('manage_finance')
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
  @RequirePermissions('view_analytics')
  @ApiOperation({ summary: 'Get detailed revenue report' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getRevenueReportEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.getRevenue.execute({ period: (query.period as '7d' | '30d' | '90d') || '7d', tenantId: user.tenantId });
  }

  @Get('analytics/disputes')
  @RequirePermissions('manage_disputes')
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
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.verifyKyc.execute({ kycId: id, ...dto });
    await this.auditLog.log({
      action: `kyc.${dto.decision.toLowerCase()}`,
      actorId: user.sub,
      actorRole: 'admin',
      tenantId: user.tenantId,
      targetType: 'kyc',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('finance/reconciliation')
  @RequirePermissions('manage_finance')
  @ApiOperation({ summary: 'Get payment reconciliation report' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', '90d'] })
  @ApiResponse({ status: 200, description: 'Reconciliation report' })
  public async getReconciliationReportEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query('period') period?: string,
  ) {
    return this.reconciliation.execute({
      tenantId: user.tenantId,
      period: period as 'today' | '7d' | '30d' | '90d' | undefined,
    });
  }

  @Get('audit-logs')
  @RequirePermissions('manage_admins')
  @ApiOperation({ summary: 'List audit logs' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'Audit log list' })
  public async listAuditLogsEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditLog.list({
      tenantId: user.tenantId,
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
    });
  }
}
