import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateUsedGoodsDto } from './dto/create-used-goods.dto';
import { UpdateUsedGoodsDto } from './dto/update-used-goods.dto';
import {
  CreateUsedGoodsUseCase,
  ListUsedGoodsUseCase,
  GetUsedGoodsUseCase,
  UpdateUsedGoodsUseCase,
} from '@afri-market/marketplace-application';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Used Goods')
@Controller('used-goods')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsedGoodsController {
  constructor(
    private readonly createListing: CreateUsedGoodsUseCase,
    private readonly listListings: ListUsedGoodsUseCase,
    private readonly getListing: GetUsedGoodsUseCase,
    private readonly updateListing: UpdateUsedGoodsUseCase,
  ) {}

  @Post()
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'List a used item for sale' })
  @ApiBody({ type: CreateUsedGoodsDto })
  @ApiResponse({ status: 201, description: 'Listing created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateUsedGoodsDto,
  ) {
    const listing = await this.createListing.execute(user.tenantId, {
      sellerId: user.sub,
      ...body,
    });
    return { data: listing };
  }

  @Get()
  @ApiOperation({ summary: 'Browse available used goods' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.listListings.execute(user.tenantId, {
      category,
      status,
      search,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data, result.total, parsedLimit, parsedOffset);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiOperation({ summary: 'Get a used goods listing by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.getListing.execute(user.tenantId, id);
    return { data: listing };
  }

  @Patch(':id')
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiOperation({ summary: 'Update a used goods listing' })
  @ApiBody({ type: UpdateUsedGoodsDto })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUsedGoodsDto,
  ) {
    const listing = await this.updateListing.execute(user.tenantId, id, user.sub, body);
    return { data: listing };
  }
}
