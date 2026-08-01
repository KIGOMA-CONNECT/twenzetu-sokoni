import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderUseCase, UpdateOrderStatusUseCase, FindOrdersUseCase, CancelOrderUseCase, CreateOrderCommand, UpdateOrderStatusCommand } from '@afri-market/marketplace-application';
import { getCurrencyForPhone } from '@afri-market/integrations';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';
import { NotificationsService } from './notifications.service';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly updateStatus: UpdateOrderStatusUseCase,
    private readonly findOrders: FindOrdersUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly entityManager: EntityManager,
    private readonly notifService: NotificationsService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    const currency = dto.currency ?? getCurrencyForPhone(user.phoneNumber);
    const command = new CreateOrderCommand(
      user.sub,
      dto.vendorId,
      dto.type,
      dto.deliveryAddress,
      dto.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      dto.paymentMethod || 'mpesa',
      dto.deliveryLatitude,
      dto.deliveryLongitude,
      dto.specialInstructions,
      user.phoneNumber,
      dto.customerEmail,
      currency,
    );
    const result = await this.createOrder.execute(user.tenantId, command);
    this.notifService.create({
      tenantId: user.tenantId,
      userId: user.sub,
      title: 'Order Placed',
      message: `Your order of ${currency} ${result.total || ''} has been placed successfully.`,
      type: 'order_placed',
      referenceId: result.orderId,
      referenceType: 'order',
    }).catch(() => {});
    return result;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List current user orders' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('limit') _limit?: number,
    @Query('offset') _offset?: number,
  ) {
    const { limit, offset } = parsePagination({ limit: _limit, offset: _offset });
    const orders = await this.findOrders.findByCustomer(user.sub);
    let filtered = orders;
    if (status) {
      filtered = orders.filter((o) => o.status === status);
    }
    return paginatedResult(filtered.slice(offset, offset + limit).map(o => o.toDto()), filtered.length, limit, offset);
  }

  @Get(':id/items')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOperation({ summary: 'Get order items' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findOrderItems(@Param('id', ParseUUIDPipe) id: string) {
    const items = await this.entityManager.query(
      'SELECT product_name as "productName", quantity, unit_price as "unitPrice", total_price as "totalPrice", currency FROM order_items WHERE order_id = $1',
      [id],
    );
    return { data: items };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.findOrders.findById(id);
    return { data: order?.toDto() ?? null };
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOperation({ summary: 'Cancel an order (PLACED or CONFIRMED only)' })
  @ApiBody({ type: CancelOrderDto })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: CancelOrderDto,
  ) {
    return this.cancelOrder.execute(user.tenantId, id, user.sub, body.reason);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOperation({ summary: 'Update order status' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async updateStatusEndpoint(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: JwtPayload) {
    const command = new UpdateOrderStatusCommand(id, dto.status);
    return this.updateStatus.execute(user.tenantId, command);
  }
}
