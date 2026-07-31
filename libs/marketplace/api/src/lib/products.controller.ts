import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards, UseInterceptors, Inject } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EntityId } from '@afri-market/kernel';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { IProductRepository, IVendorRepository } from '@afri-market/marketplace-domain';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductUseCase, FindProductsUseCase, SearchProductsUseCase, CreateProductCommand, PRODUCT_REPOSITORY, VENDOR_REPOSITORY } from '@afri-market/marketplace-application';
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
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
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
      dto.description ?? '',
      dto.price,
      dto.currency ?? 'TZS',
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
      return { data: products.map(p => p.toDto()) };
    }
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.searchProducts.execute(user.tenantId, {
      search,
      categoryId,
      minPrice,
      maxPrice,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data.map(p => p.toDto()), result.total, parsedLimit, parsedOffset);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.findProducts.findById(id);
    return { data: product?.toDto() ?? null };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  public async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const product = await this.productRepo.findById(EntityId.from(id));
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    const vendor = await this.vendorRepo.findByUserId(user.sub);
    if (!vendor || product.vendorId.value !== vendor.id.value) {
      return { success: false, error: 'Not authorized to delete this product' };
    }
    await this.productRepo.delete(EntityId.from(id));
    return { success: true };
  }
}
