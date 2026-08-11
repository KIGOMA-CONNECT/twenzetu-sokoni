import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderUseCase, UpdateOrderStatusUseCase, FindOrdersUseCase, CancelOrderUseCase, CreateOrderCommand, UpdateOrderStatusCommand, CheckoutCartUseCase, VendorAccessService } from '@afri-market/marketplace-application';
import { getCurrencyForPhone } from '@afri-market/integrations';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';
import { NotificationsService } from './notifications.service';
import { OrderNotifierService } from './order-notifier.service';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly updateStatus: UpdateOrderStatusUseCase,
    private readonly findOrders: FindOrdersUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly checkoutCart: CheckoutCartUseCase,
    private readonly entityManager: EntityManager,
    private readonly notifService: NotificationsService,
    private readonly orderNotifier: OrderNotifierService,
    private readonly vendorAccess: VendorAccessService,
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

  @Post('checkout')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Checkout a server-side cart into an order (server-validated prices and stock)' })
  @ApiBody({ type: CheckoutCartDto })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Cart empty, unavailable product or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async checkout(@Body() dto: CheckoutCartDto, @CurrentUser() user: JwtPayload) {
    const result = await this.checkoutCart.execute({
      tenantId: user.tenantId,
      userId: user.sub,
      cartId: dto.cartId,
      paymentMethod: dto.paymentMethod || 'mpesa',
      deliveryAddress: dto.deliveryAddress,
      deliveryLatitude: dto.deliveryLatitude,
      deliveryLongitude: dto.deliveryLongitude,
      specialInstructions: dto.specialInstructions,
      customerPhone: user.phoneNumber,
      customerEmail: dto.customerEmail,
      currency: dto.currency,
    });
    this.notifService.create({
      tenantId: user.tenantId,
      userId: user.sub,
      title: 'Order Placed',
      message: `Your order of ${dto.currency ?? 'TZS'} ${result.total || ''} has been placed successfully.`,
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
  public async findOrderItems(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const order = await this.findOrders.findById(id);
    if (!order || !(await this.canAccessOrder(order, user))) {
      throw new NotFoundException('Order not found');
    }
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
  public async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const order = await this.findOrders.findById(id);
    if (!order || !(await this.canAccessOrder(order, user))) {
      throw new NotFoundException('Order not found');
    }
    return { data: order.toDto() };
  }

  private async canAccessOrder(order: { customerId: { value: string }; vendorId: { value: string }; driverId?: { value: string } }, user: JwtPayload): Promise<boolean> {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return true;
    }
    if (user.role === 'vendor') {
      const ctx = await this.vendorAccess.resolve(user);
      if (ctx && ctx.vendorId === order.vendorId.value) {
        return true;
      }
    }
    if (user.role === 'driver' && order.driverId && order.driverId.value === user.sub) {
      return true;
    }
    return order.customerId.value === user.sub;
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
    let vendorId: string | undefined;
    if (user.role === 'vendor') {
      const ctx = await this.vendorAccess.resolve(user);
      vendorId = ctx?.vendorId;
    }
    const command = new UpdateOrderStatusCommand(id, dto.status);
    const result = await this.updateStatus.execute(user.tenantId, command, { role: user.role, vendorId });
    this.orderNotifier.notifyCustomerStatusChanged({
      tenantId: user.tenantId,
      orderId: id,
      newStatus: result.status,
    });
    return result;
  }
}
