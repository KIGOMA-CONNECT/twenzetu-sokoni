import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductUseCase, FindProductsUseCase, SearchProductsUseCase, CreateProductCommand } from '@afri-market/marketplace-application';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly findProducts: FindProductsUseCase,
    private readonly searchProducts: SearchProductsUseCase,
  ) {}

  @Post()
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    const command = new CreateProductCommand(
      user.sub,
      dto.name,
      dto.description,
      dto.price,
      dto.currency ?? 'RWF',
      dto.type,
      dto.categoryId,
      dto.imageUrl,
      dto.stockQuantity ?? 0,
      dto.unit ?? 'pcs',
    );
    return this.createProduct.execute(user.tenantId, command);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiOperation({ summary: 'Search or list products' })
  @ApiQuery({ name: 'vendorId', required: false, description: 'Filter by vendor ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Full-text search on name/description' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category UUID' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('vendorId') vendorId?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    if (vendorId) {
      const products = await this.findProducts.findByVendor(vendorId);
      return { data: products };
    }
    if (search || categoryId || minPrice !== undefined || maxPrice !== undefined) {
      const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
      const result = await this.searchProducts.execute(user.tenantId, {
        search,
        categoryId,
        minPrice,
        maxPrice,
        limit: parsedLimit,
        offset: parsedOffset,
      });
      return paginatedResult(result.data, result.total, parsedLimit, parsedOffset);
    }
    return { data: [] };
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.findProducts.findById(id);
    return { data: product };
  }
}
