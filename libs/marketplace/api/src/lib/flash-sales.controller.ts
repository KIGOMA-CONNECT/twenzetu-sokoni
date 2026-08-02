import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateFlashSaleUseCase, ListActiveFlashSalesUseCase, ListFlashSalesUseCase } from '@afri-market/marketplace-application';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Flash Sales')
@Controller('flash-sales')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FlashSalesController {
  constructor(
    private readonly createFlashSale: CreateFlashSaleUseCase,
    private readonly listActive: ListActiveFlashSalesUseCase,
    private readonly listFlashSales: ListFlashSalesUseCase,
  ) {}

  @Post()
  public async create(@Body() body: any, @CurrentUser() user: JwtPayload) {
    return this.createFlashSale.execute(user.tenantId, body);
  }

  @Get('active')
  public async getActive(@CurrentUser() user: JwtPayload) {
    const sales = await this.listActive.execute(user.tenantId);
    return { data: sales.map(s => s.toDto()) };
  }

  @Get()
  public async findAll(@CurrentUser() user: JwtPayload, @Query('status') status?: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const p = parsePagination({ limit, offset });
    const result = await this.listFlashSales.execute(user.tenantId, { status, ...p });
    return paginatedResult(result.data.map(s => s.toDto()), result.total, p.limit, p.offset);
  }
}
