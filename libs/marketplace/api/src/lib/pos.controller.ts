import { BadRequestException, Body, Controller, ForbiddenException, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  CreatePosSaleUseCase,
  GetPosDayReportUseCase,
  FindProductsUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { PosCheckoutDto } from './dto/pos-checkout.dto';

@ApiTags('POS')
@Controller('pos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PosController {
  constructor(
    private readonly createPosSale: CreatePosSaleUseCase,
    private readonly getDayReport: GetPosDayReportUseCase,
    private readonly findProducts: FindProductsUseCase,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'Products for the POS register (requires use_pos)' })
  public async products(@CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'use_pos');
    if (!ctx) {
      throw new ForbiddenException('You do not have POS permission');
    }
    const products = await this.findProducts.findByVendor(ctx.vendorId);
    return { data: products.map((p) => p.toDto()) };
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Ring up a sale, record it and deduct stock atomically' })
  public async checkout(@Body() dto: PosCheckoutDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'use_pos');
    if (!ctx) {
      throw new ForbiddenException('You do not have POS permission');
    }
    try {
      const result = await this.createPosSale.execute({
        tenantId: user.tenantId,
        vendorId: ctx.vendorId,
        operatorId: user.sub,
        shopName: ctx.shopName,
        items: dto.items,
        paymentMethod: dto.paymentMethod ?? 'cash',
        amountTendered: dto.amountTendered,
      });
      return { data: result };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Get('report')
  @ApiOperation({ summary: 'End-of-day report for the vendor (requires view_reports)' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (defaults to today)' })
  public async report(@Query('date') date: string | undefined, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'view_reports');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to view reports');
    }
    try {
      const report = await this.getDayReport.execute({
        tenantId: user.tenantId,
        vendorId: ctx.vendorId,
        date,
      });
      return { data: { ...report, shopName: ctx.shopName } };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}