import { BadRequestException, Controller, ForbiddenException, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  VendorAccountingService,
  resolveCustomRange,
  resolvePeriodRange,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { VendorAccountingQueryDto } from './dto/vendor-accounting-query.dto';

@ApiTags('Vendor Accounting')
@Controller('vendor/accounting')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorAccountingController {
  constructor(
    private readonly accounting: VendorAccountingService,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  private async resolveContext(user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'view_reports');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to view reports');
    }
    return ctx;
  }

  private resolveRange(dto: VendorAccountingQueryDto) {
    try {
      if (dto.from || dto.to) {
        return resolveCustomRange(dto.from, dto.to);
      }
      return resolvePeriodRange(dto.period);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Get('summary')
  @ApiOperation({ summary: 'Revenue summary for the vendor over a period (requires view_reports)' })
  public async summary(@Query() dto: VendorAccountingQueryDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    const range = this.resolveRange(dto);
    const data = await this.accounting.summary(user.tenantId, ctx.vendorId, range);
    return { data };
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Itemised accounting entries for the vendor over a period (requires view_reports)' })
  public async ledger(@Query() dto: VendorAccountingQueryDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    const range = this.resolveRange(dto);
    const data = await this.accounting.ledger(user.tenantId, ctx.vendorId, range);
    return { data };
  }

  @Get('report')
  @ApiOperation({ summary: 'Full accounting report: summary + daily breakdown + ledger (requires view_reports)' })
  public async report(@Query() dto: VendorAccountingQueryDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    const range = this.resolveRange(dto);
    const data = await this.accounting.report(user.tenantId, ctx.vendorId, range);
    return { data: { ...data, shopName: ctx.shopName } };
  }
}