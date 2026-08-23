import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EntityId } from '@afri-market/kernel';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { IProductRepository } from '@afri-market/marketplace-domain';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkCreateProductsDto } from './dto/bulk-create-products.dto';
import { CreateProductUseCase, UpdateProductUseCase, BulkCreateProductsUseCase, FindProductsUseCase, SearchProductsUseCase, VendorAccessService, CreateProductCommand, UpdateProductCommand, BulkCreateProductsCommand, PRODUCT_REPOSITORY } from '@afri-market/marketplace-application';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly bulkCreateProducts: BulkCreateProductsUseCase,
    private readonly findProducts: FindProductsUseCase,
    private readonly searchProducts: SearchProductsUseCase,
    private readonly vendorAccess: VendorAccessService,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  @Post()
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'manage_products');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to manage products');
    }
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
      dto.sku,
      dto.barcode,
    );
    return this.createProduct.execute(user.tenantId, command, ctx.isOwner ? undefined : ctx.vendorId);
  }

  @Post('bulk')
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Bulk create products' })
  @ApiBody({ type: BulkCreateProductsDto })
  @ApiResponse({ status: 201, description: 'Bulk import result' })
  public async bulkCreate(@Body() dto: BulkCreateProductsDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'manage_products');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to manage products');
    }
    const commands = dto.products.map(
      (p) => new CreateProductCommand(
        user.sub,
        p.name,
        p.description ?? '',
        p.price,
        p.currency ?? 'TZS',
        p.type,
        p.categoryId,
        p.imageUrl,
        p.stockQuantity ?? 0,
        p.unit ?? 'pcs',
        p.sku,
        p.barcode,
      ),
    );
    return this.bulkCreateProducts.execute(user.tenantId, new BulkCreateProductsCommand(user.sub, commands), ctx.isOwner ? undefined : ctx.vendorId);
  }

  @Get()
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
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.findProducts.findById(id);
    return { data: product?.toDto() ?? null };
  }

  @Patch(':id')
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Update a product' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated' })
  public async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'manage_products');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to manage products');
    }
    const command = new UpdateProductCommand(
      id,
      user.sub,
      dto.name,
      dto.description,
      dto.price,
      dto.currency,
      dto.type,
      dto.categoryId,
      dto.imageUrl === '' ? undefined : dto.imageUrl,
      dto.stockQuantity,
      dto.unit,
      dto.sku,
      dto.barcode,
      dto.status,
    );
    return this.updateProduct.execute(user.tenantId, command, ctx.isOwner ? undefined : ctx.vendorId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  public async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'manage_products');
    if (!ctx) {
      throw new ForbiddenException('Not authorized to delete this product');
    }
    const product = await this.productRepo.findById(EntityId.from(id));
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.vendorId.value !== ctx.vendorId) {
      throw new ForbiddenException('Not authorized to delete this product');
    }
    await this.productRepo.delete(EntityId.from(id));
    return { success: true };
  }
}
