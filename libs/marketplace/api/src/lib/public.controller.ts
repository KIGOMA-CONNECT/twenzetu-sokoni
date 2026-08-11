import { BadRequestException, Controller, Get, Inject, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { EntityManager } from 'typeorm';
import {
  ListActiveAdsUseCase,
  ListCategoriesUseCase,
  SearchVendorsUseCase,
  SearchProductsUseCase,
  FindProductsUseCase,
} from '@afri-market/marketplace-application';
import { CargoFareCalculator, haversineKm } from '@afri-market/marketplace-domain';
import { CargoFareQueryDto } from './dto/create-cargo-request.dto';
import { ParseFlexibleUuidPipe } from './common/parse-flexible-uuid.pipe';
import { parsePagination, paginatedResult } from './pagination';

const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000002';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly listActiveAds: ListActiveAdsUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly searchVendors: SearchVendorsUseCase,
    private readonly searchProducts: SearchProductsUseCase,
    private readonly findProducts: FindProductsUseCase,
    @Inject(EntityManager) private readonly entityManager: EntityManager,
  ) {}

  @Get('ads')
  @ApiOperation({ summary: 'Public list of active marketing adverts' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiResponse({ status: 200, description: 'Active adverts' })
  public async ads(@Req() req: Request) {
    const tenantId = this.resolveTenant(req);
    const ads = await this.listActiveAds.execute(tenantId);
    return { data: ads.map((a) => a.toDto()) };
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Public catalog of active categories with marketing data' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiResponse({ status: 200, description: 'Active categories' })
  public async catalog(@Req() req: Request) {
    const tenantId = this.resolveTenant(req);
    const categories = await this.listCategories.execute(tenantId);
    return { data: categories.map((c) => c.toDto()) };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Public list of active categories' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiResponse({ status: 200, description: 'Active categories' })
  public async categories(@Req() req: Request) {
    const tenantId = this.resolveTenant(req);
    const categories = await this.listCategories.execute(tenantId);
    return { data: categories.map((c) => c.toDto()) };
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Public list/search of vendors' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async vendors(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minRating') minRating?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const tenantId = this.resolveTenant(req);
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.searchVendors.execute(tenantId, {
      search,
      category,
      minRating,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data.map((v) => v.toDto()), result.total, parsedLimit, parsedOffset);
  }

  @Get('products')
  @ApiOperation({ summary: 'Public list/search of products' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiQuery({ name: 'vendorId', required: false, description: 'Filter by vendor ID' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category UUID' })
  @ApiQuery({ name: 'search', required: false, description: 'Full-text search on name/description' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async products(
    @Req() req: Request,
    @Query('vendorId') vendorId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    if (vendorId) {
      const products = await this.findProducts.findByVendor(vendorId);
      return { data: products.map((p) => p.toDto()) };
    }
    const tenantId = this.resolveTenant(req);
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.searchProducts.execute(tenantId, {
      search,
      categoryId,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data.map((p) => p.toDto()), result.total, parsedLimit, parsedOffset);
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Public autocomplete search suggestions' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async searchSuggestions(
    @Req() req: Request,
    @Query('q') q: string,
    @Query('limit') limit?: number,
  ) {
    if (!q || q.length < 2) return { data: [] };
    const tenantId = this.resolveTenant(req);
    const result = await this.entityManager.query(
      `SELECT id, name, price, currency, image_url, vendor_id
       FROM products
       WHERE tenant_id = $1 AND status = 'ACTIVE' AND name ILIKE $2
       ORDER BY
         CASE WHEN name ILIKE $3 THEN 0 ELSE 1 END,
         name ASC
       LIMIT $4`,
      [tenantId, `%${q}%`, `${q}%`, limit ?? 8],
    );
    return { data: result };
  }

  @Get('products/:id/similar')
  @ApiOperation({ summary: 'Public similar products by category' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findSimilar(
    @Req() req: Request,
    @Param('id', ParseFlexibleUuidPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.resolveTenant(req);
    const result = await this.entityManager.query(
      `SELECT p.id, p.name, p.description, p.price, p.currency, p.type, p.stock_quantity, p.unit, p.status, p.image_url, p.vendor_id, p.created_at
       FROM products p
       WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1 AND tenant_id = $2)
         AND p.id != $1
         AND p.tenant_id = $2
         AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC
       LIMIT $3`,
      [id, tenantId, limit ?? 10],
    );
    return { data: result };
  }

  @Get('cargo/fare')
  @ApiOperation({ summary: 'Public live cargo fare quote (server-computed, binding)' })
  @ApiResponse({ status: 200, description: 'Fare breakdown' })
  @ApiResponse({ status: 400, description: 'Invalid input (e.g. weight exceeds vehicle capacity)' })
  public async cargoFare(@Query() query: CargoFareQueryDto) {
    const distanceKm = haversineKm(query.pickupLat, query.pickupLng, query.dropLat, query.dropLng);
    const insured = query.insured === 'true';
    try {
      return CargoFareCalculator.calculate({
        distanceKm,
        weightKg: query.weightKg,
        vehicleType: query.vehicle,
        tripType: query.tripType ?? 'instant',
        insured,
        cargoValue: query.cargoValue,
        currency: 'TZS',
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  private resolveTenant(req: Request): string {
    const header = req.headers['x-tenant-id'];
    if (typeof header === 'string' && header.trim().length > 0) {
      return header.trim();
    }
    return DEFAULT_TENANT_ID;
  }
}
