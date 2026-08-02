import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { VendorUpdateOrderStatusDto } from './dto/vendor-update-order-status.dto';
import {
  CreateVendorUseCase,
  FindVendorsUseCase,
  GetVendorOrdersUseCase,
  VendorUpdateOrderStatusUseCase,
  GetVendorStatsUseCase,
  SearchVendorsUseCase,
  FindProductsUseCase,
  CreateVendorCommand,
} from '@afri-market/marketplace-application';
import { MarketplaceGateway } from './gateway';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorsController {
  constructor(
    private readonly createVendor: CreateVendorUseCase,
    private readonly findVendors: FindVendorsUseCase,
    private readonly getVendorOrders: GetVendorOrdersUseCase,
    private readonly updateOrderStatus: VendorUpdateOrderStatusUseCase,
    private readonly getVendorStats: GetVendorStatsUseCase,
    private readonly searchVendors: SearchVendorsUseCase,
    private readonly findProducts: FindProductsUseCase,
    private readonly gateway: MarketplaceGateway,
  ) {}

  @Post()
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiBody({ type: CreateVendorDto })
  @ApiResponse({ status: 201, description: 'Vendor created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateVendorDto, @CurrentUser() user: JwtPayload) {
    const command = new CreateVendorCommand(
      user.sub,
      dto.shopName,
      dto.description,
      dto.category,
      dto.commissionRate,
      dto.latitude,
      dto.longitude,
    );
    return this.createVendor.execute(user.tenantId, command);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiOperation({ summary: 'List/search vendors' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minRating') minRating?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.searchVendors.execute(user.tenantId, {
      search,
      category,
      minRating,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data.map(v => v.toDto()), result.total, parsedLimit, parsedOffset);
  }

  @Get('me/orders')
  @ApiOperation({ summary: 'Get orders for the current user vendor' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async getMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const vendor = await this.findVendors.findByUserId(user.sub);
    if (!vendor) {
      return { data: [], total: 0 };
    }
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.getVendorOrders.execute(user.tenantId, vendor.id.value, {
      status,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data.map(o => o.toDto()), result.total, parsedLimit, parsedOffset);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get vendor dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async getMyStats(@CurrentUser() user: JwtPayload) {
    const vendor = await this.findVendors.findByUserId(user.sub);
    if (!vendor) {
      return { error: 'Vendor profile not found' };
    }
    return this.getVendorStats.execute(user.tenantId, vendor.id.value);
  }

  @Get('me/products')
  @ApiOperation({ summary: 'Get products for the current vendor' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async getMyProducts(@CurrentUser() user: JwtPayload) {
    const vendor = await this.findVendors.findByUserId(user.sub);
    if (!vendor) {
      return { data: [] };
    }
    const products = await this.findProducts.findByVendor(vendor.id.value);
    return { data: products.map(p => p.toDto()) };
  }

  @Patch('me/orders/:orderId/status')
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Vendor updates order status (confirm, prepare, cancel)' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiBody({ type: VendorUpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async updateOrderStatusEndpoint(
    @CurrentUser() user: JwtPayload,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: VendorUpdateOrderStatusDto,
  ) {
    const vendor = await this.findVendors.findByUserId(user.sub);
    if (!vendor) {
      return { error: 'Vendor profile not found' };
    }
    const result = await this.updateOrderStatus.execute(user.tenantId, orderId, vendor.id.value, body.status);
    this.gateway.notifyOrderUpdate(orderId, { status: body.status, vendorId: vendor.id.value });
    return result;
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const vendor = await this.findVendors.findById(id);
    return { data: vendor?.toDto() ?? null };
  }
}
