import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateCouponUseCase, ValidateCouponUseCase, ListCouponsUseCase } from '@afri-market/marketplace-application';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Coupons')
@Controller('coupons')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CouponsController {
  constructor(
    private readonly createCoupon: CreateCouponUseCase,
    private readonly validateCoupon: ValidateCouponUseCase,
    private readonly listCoupons: ListCouponsUseCase,
  ) {}

  @Post()
  public async create(@Body() body: any, @CurrentUser() user: JwtPayload) {
    return this.createCoupon.execute(user.tenantId, body);
  }

  @Get('validate/:code')
  public async validate(@Param('code') code: string, @Query('amount') amount: string, @CurrentUser() user: JwtPayload) {
    return this.validateCoupon.execute(user.tenantId, code, Number(amount || '0'));
  }

  @Get()
  public async findAll(@CurrentUser() user: JwtPayload, @Query('status') status?: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const p = parsePagination({ limit, offset });
    const result = await this.listCoupons.execute(user.tenantId, { status, ...p });
    return paginatedResult(result.data.map(c => c.toDto()), result.total, p.limit, p.offset);
  }
}
