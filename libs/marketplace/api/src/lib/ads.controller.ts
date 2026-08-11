import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateAdvertUseCase, ListAdvertsUseCase } from '@afri-market/marketplace-application';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Ads')
@Controller('ads')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdsController {
  constructor(
    private readonly createAdvert: CreateAdvertUseCase,
    private readonly listAdverts: ListAdvertsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a marketing advert' })
  @ApiResponse({ status: 201, description: 'Advert created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateAdvertDto, @CurrentUser() user: JwtPayload) {
    return this.createAdvert.execute(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List marketing adverts for a tenant' })
  @ApiResponse({ status: 200, description: 'Adverts' })
  public async findAll(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const p = parsePagination({ limit, offset });
    const result = await this.listAdverts.execute(user.tenantId, p);
    return paginatedResult(result.data.map((a) => a.toDto()), result.total, p.limit, p.offset);
  }
}
