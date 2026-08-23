import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  CreatePosSaleUseCase,
  GetPosDayReportUseCase,
  FindProductsUseCase,
  OpenPosShiftUseCase,
  ClosePosShiftUseCase,
  GetCurrentPosShiftUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { PosCheckoutDto } from './dto/pos-checkout.dto';
import { OpenPosShiftDto, ClosePosShiftDto } from './dto/pos-shift.dto';

@ApiTags('POS')
@Controller('pos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PosController {
  constructor(
    private readonly createPosSale: CreatePosSaleUseCase,
    private readonly getDayReport: GetPosDayReportUseCase,
    private readonly findProducts: FindProductsUseCase,
    private readonly openShift: OpenPosShiftUseCase,
    private readonly closeShift: ClosePosShiftUseCase,
    private readonly getCurrentShift: GetCurrentPosShiftUseCase,
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

  @Get('shifts/current')
  @ApiOperation({ summary: 'Get the currently open POS shift (requires use_pos)' })
  public async getCurrentShiftEndpoint(@CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'use_pos');
    if (!ctx) {
      throw new ForbiddenException('You do not have POS permission');
    }
    const { shift } = await this.getCurrentShift.execute(ctx.vendorId);
    return { data: shift?.toDto() ?? null };
  }

  @Post('shifts/open')
  @ApiOperation({ summary: 'Open a new POS shift (requires use_pos)' })
  public async openShiftEndpoint(@Body() dto: OpenPosShiftDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'use_pos');
    if (!ctx) {
      throw new ForbiddenException('You do not have POS permission');
    }
    try {
      const { shift } = await this.openShift.execute({
        tenantId: user.tenantId,
        vendorId: ctx.vendorId,
        operatorId: user.sub,
        openingFloat: dto.openingFloat ?? 0,
      });
      return { data: shift.toDto() };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post('shifts/close')
  @ApiOperation({ summary: 'Close the current POS shift (requires use_pos)' })
  public async closeShiftEndpoint(@Body() dto: ClosePosShiftDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'use_pos');
    if (!ctx) {
      throw new ForbiddenException('You do not have POS permission');
    }
    try {
      const { shift } = await this.closeShift.execute({
        vendorId: ctx.vendorId,
        closedBy: user.sub,
        closingCash: dto.closingCash,
        notes: dto.notes,
      });
      return { data: shift.toDto() };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}