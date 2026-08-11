import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import { CommissionService } from '@afri-market/core-finance';
import { VendorAccessService } from '@afri-market/marketplace-application';

@ApiTags('Commissions')
@Controller('commissions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CommissionsController {
  constructor(
    private readonly commissions: CommissionService,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  private async resolvePayer(user: JwtPayload): Promise<{ payerId: string; payerType: 'vendor' | 'driver' }> {
    if (user.role === 'driver') {
      return { payerId: user.sub, payerType: 'driver' };
    }
    const ctx = await this.vendorAccess.resolve(user);
    return { payerId: ctx ? ctx.vendorId : user.sub, payerType: 'vendor' };
  }

  @Get('me')
  @ApiOperation({ summary: 'My commission records (vendors and drivers)' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async mine(@CurrentUser() user: JwtPayload) {
    const { payerId, payerType } = await this.resolvePayer(user);
    const records = payerType === 'driver'
      ? await this.commissions.getDriverCommissions(payerId)
      : await this.commissions.getVendorCommissions(payerId);
    return { data: records };
  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'super_admin', 'finance_admin', 'operations_admin', 'compliance_admin')
  @ApiOperation({ summary: 'Commission summary for a tenant (admin only)' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async summary(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.commissions.getCommissionSummary(
      user.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
