import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { VendorUpdateOrderStatusDto } from './dto/vendor-update-order-status.dto';
import { ParseFlexibleUuidPipe } from './common/parse-flexible-uuid.pipe';
import {
  CreateVendorUseCase,
  FindVendorsUseCase,
  GetVendorOrdersUseCase,
  VendorUpdateOrderStatusUseCase,
  GetVendorStatsUseCase,
  SearchVendorsUseCase,
  FindProductsUseCase,
  CreateVendorCommand,
  UpdateVendorProfileCommand,
  UpdateVendorProfileUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { MarketplaceGateway } from './gateway';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';
import { OrderNotifierService } from './order-notifier.service';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorsController {
  constructor(
    private readonly createVendor: CreateVendorUseCase,
    private readonly updateVendorProfile: UpdateVendorProfileUseCase,
    private readonly findVendors: FindVendorsUseCase,
    private readonly getVendorOrders: GetVendorOrdersUseCase,
    private readonly updateOrderStatus: VendorUpdateOrderStatusUseCase,
    private readonly getVendorStats: GetVendorStatsUseCase,
    private readonly searchVendors: SearchVendorsUseCase,
    private readonly findProducts: FindProductsUseCase,
    private readonly gateway: MarketplaceGateway,
    private readonly orderNotifier: OrderNotifierService,
    private readonly vendorAccess: VendorAccessService,
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
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx) {
      return { data: [], total: 0 };
    }
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.getVendorOrders.execute(user.tenantId, ctx.vendorId, {
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
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx) {
      throw new NotFoundException('Vendor profile not found');
    }
    return this.getVendorStats.execute(user.tenantId, ctx.vendorId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current vendor profile' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async getMyProfile(@CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx) {
      return { data: null };
    }
    const vendor = await this.findVendors.findById(ctx.vendorId);
    return { data: vendor?.toDto() ?? null };
  }

  @Patch('me/profile')
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Update current vendor profile' })
  @ApiBody({ type: UpdateVendorProfileDto })
  @ApiResponse({ status: 200, description: 'Vendor profile updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the shop owner can update the profile' })
  public async updateMyProfile(@Body() dto: UpdateVendorProfileDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx) {
      throw new NotFoundException('Vendor profile not found');
    }
    if (!ctx.isOwner) {
      throw new ForbiddenException('Only the shop owner can update the profile');
    }
    const command = new UpdateVendorProfileCommand(
      dto.shopName,
      dto.description,
      dto.category,
      dto.latitude,
      dto.longitude,
      dto.settings,
    );
    return this.updateVendorProfile.execute(ctx.vendorId, command);
  }

  @Get('me/products')
  @ApiOperation({ summary: 'Get products for the current vendor' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async getMyProducts(@CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx) {
      return { data: [] };
    }
    const products = await this.findProducts.findByVendor(ctx.vendorId);
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
    const ctx = await this.vendorAccess.assertPermission(user, 'manage_orders');
    if (!ctx) {
      throw new NotFoundException('Vendor profile not found');
    }
    const result = await this.updateOrderStatus.execute(user.tenantId, orderId, ctx.vendorId, body.status);
    this.gateway.notifyOrderUpdate(orderId, { status: body.status, vendorId: ctx.vendorId });
    this.orderNotifier.notifyCustomerStatusChanged({
      tenantId: user.tenantId,
      orderId,
      newStatus: result.status,
    });
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findOne(@Param('id', ParseFlexibleUuidPipe) id: string) {
    const vendor = await this.findVendors.findById(id);
    return { data: vendor?.toDto() ?? null };
  }
}
