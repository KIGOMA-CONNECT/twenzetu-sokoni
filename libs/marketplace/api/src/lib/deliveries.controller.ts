import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ManualAssignDriverDto } from './dto/manual-assign-driver.dto';
import { DriverUpdateDeliveryStatusDto } from './dto/driver-update-delivery-status.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import {
  CreateDeliveryUseCase,
  FindDeliveriesUseCase,
  CompleteDeliveryUseCase,
  GetDriverDeliveriesUseCase,
  DriverUpdateDeliveryStatusUseCase,
  GetDeliveryTrackingUseCase,
  UpdateDriverLocationUseCase,
  AssignDriverUseCase,
  BulkAssignDeliveriesUseCase,
  CreateDeliveryCommand,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { MarketplaceGateway } from './gateway';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';
import { OrderNotifierService } from './order-notifier.service';
import { NotificationsService } from './notifications.service';
import { BulkAssignDeliveriesDto } from './dto/bulk-fleet-ops.dto';

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

@ApiTags('Deliveries')
@Controller('deliveries')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DeliveriesController {
  constructor(
    private readonly createDelivery: CreateDeliveryUseCase,
    private readonly findDeliveries: FindDeliveriesUseCase,
    private readonly completeDelivery: CompleteDeliveryUseCase,
    private readonly getDriverDeliveries: GetDriverDeliveriesUseCase,
    private readonly driverUpdateStatus: DriverUpdateDeliveryStatusUseCase,
    private readonly getDeliveryTracking: GetDeliveryTrackingUseCase,
    private readonly updateDriverLocation: UpdateDriverLocationUseCase,
    private readonly assignDriver: AssignDriverUseCase,
    private readonly bulkAssignDeliveries: BulkAssignDeliveriesUseCase,
    private readonly gateway: MarketplaceGateway,
    private readonly orderNotifier: OrderNotifierService,
    private readonly vendorAccess: VendorAccessService,
    private readonly notifications: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  @Post()
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Create a new delivery assignment' })
  @ApiBody({ type: CreateDeliveryDto })
  @ApiResponse({ status: 201, description: 'Delivery created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateDeliveryDto, @CurrentUser() user: JwtPayload) {
    const command = new CreateDeliveryCommand(
      dto.orderId,
      dto.driverId,
      dto.vehicleType,
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.pickupLatitude,
      dto.pickupLongitude,
      dto.deliveryLatitude,
      dto.deliveryLongitude,
    );
    let vendorId: string | undefined;
    if (user.role === 'vendor') {
      const ctx = await this.vendorAccess.resolve(user);
      vendorId = ctx?.vendorId;
    }
    return this.createDelivery.execute(user.tenantId, command, { userId: user.sub, role: user.role, vendorId });
  }

  @Get('driver/:driverId')
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiOperation({ summary: 'List deliveries by driver' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  public async findByDriver(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('limit') _limit?: number,
    @Query('offset') _offset?: number,
  ) {
    const adminRoles = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'compliance_admin', 'support_admin', 'marketing_admin'];
    if (user.sub !== driverId && !adminRoles.includes(user.role)) {
      throw new ForbiddenException('You can only view your own deliveries');
    }
    const { limit, offset } = parsePagination({ limit: _limit, offset: _offset });
    const { data, total } = await this.findDeliveries.findByDriver(user.tenantId, driverId, { status, limit, offset });
    return paginatedResult(data.map(d => d.toDto()), total, limit, offset);
  }

  @Get('admin/queue')
  @ApiOperation({ summary: 'List orders awaiting driver assignment + available drivers (admin only)' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  public async getDispatchQueue(@CurrentUser() user: JwtPayload) {
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Admin access required');
    }
    const orders = await this.getQueuedOrders(user.tenantId);
    const drivers = await this.getAvailableDrivers(user.tenantId);
    return { data: { orders, drivers } };
  }

  @Post('admin/assign')
  @ApiOperation({ summary: 'Manually assign a driver to an order (admin only)' })
  @ApiResponse({ status: 201, description: 'Driver assigned' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  public async assign(
    @Body() body: ManualAssignDriverDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Admin access required');
    }
    const result = await this.assignDriver.execute(user.tenantId, body.orderId, body.driverId);

    await this.notifications.create({
      tenantId: result.tenantId,
      userId: result.driverId,
      title: 'Delivery Assigned',
      message: `Pick up order ${result.orderId} from ${result.vendorName} and deliver to ${result.deliveryAddress}`,
      type: 'delivery_assigned',
      referenceId: result.orderId,
      referenceType: 'order',
    });

    this.gateway.notifyDriverDelivery(result.tenantId, result.driverId, {
      deliveryId: result.deliveryId,
      orderId: result.orderId,
      status: 'PENDING',
    });

    return { data: result };
  }

  @Post('admin/bulk-assign')
  @ApiOperation({ summary: 'Assign a batch of queued orders to available drivers, least-loaded first (admin only)' })
  @ApiResponse({ status: 201, description: 'Bulk assignment result' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  public async bulkAssign(
    @Body() dto: BulkAssignDeliveriesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Admin access required');
    }
    const result = await this.bulkAssignDeliveries.execute(user.tenantId, dto.orderIds, dto.driverIds);

    // Notify drivers + push socket events for every successful assignment.
    for (const item of result.results) {
      if (!item.success || !item.driverId || !item.deliveryId) continue;
      const order = await this.dataSource.query(
        `SELECT v.shop_name AS "vendorName", o.delivery_address AS "deliveryAddress"
           FROM orders o JOIN vendors v ON v.id = o.vendor_id
          WHERE o.id = $1`,
        [item.orderId],
      );
      const vendorName = order[0]?.vendorName ?? 'the vendor';
      const deliveryAddress = order[0]?.deliveryAddress ?? '';
      await this.notifications.create({
        tenantId: user.tenantId,
        userId: item.driverId,
        title: 'Delivery Assigned',
        message: `Pick up order ${item.orderId} from ${vendorName} and deliver to ${deliveryAddress}`,
        type: 'delivery_assigned',
        referenceId: item.orderId,
        referenceType: 'order',
      });
      this.gateway.notifyDriverDelivery(user.tenantId, item.driverId, {
        deliveryId: item.deliveryId,
        orderId: item.orderId,
        status: 'PENDING',
      });
    }

    return { data: result };
  }

  private async getQueuedOrders(tenantId: string) {
    const rows = await this.dataSource.query(
      `SELECT o.id, o.status, o.delivery_address AS "deliveryAddress",
              o.delivery_latitude AS "deliveryLatitude", o.delivery_longitude AS "deliveryLongitude",
              o.delivery_fee AS "deliveryFee", o.total_amount AS "totalAmount", o.currency,
              o.created_at AS "createdAt",
              v.shop_name AS "vendorName"
       FROM orders o
       JOIN vendors v ON v.id = o.vendor_id
       WHERE o.tenant_id = $1
         AND o.status IN ('PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP')
         AND NOT EXISTS (
           SELECT 1 FROM deliveries d
           WHERE d.order_id = o.id AND d.status <> 'FAILED'
         )
       ORDER BY o.created_at ASC
       LIMIT 50`,
      [tenantId],
    );
    return rows;
  }

  private async getAvailableDrivers(tenantId: string) {
    const rows = await this.dataSource.query(
      `SELECT u.id AS "driverId", u.full_name AS "fullName", u.phone_number AS "phoneNumber",
              v.vehicle_type AS "vehicleType", v.plate_number AS "plateNumber",
              v.is_online AS "isOnline", v.is_available AS "isAvailable"
       FROM users u
       JOIN vehicles v ON v.driver_id = u.id
       WHERE u.tenant_id = $1 AND u.role = 'driver' AND v.is_available = true
       ORDER BY v.is_online DESC, v.updated_at DESC
       LIMIT 100`,
      [tenantId],
    );
    return rows;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get deliveries assigned to current user as driver' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async getMyDeliveries(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.getDriverDeliveries.execute(user.tenantId, user.sub, {
      status,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data.map(d => d.toDto()), result.total, parsedLimit, parsedOffset);
  }

  @Patch(':id/status')
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Delivery ID' })
  @ApiOperation({ summary: 'Driver updates delivery status' })
  @ApiBody({ type: DriverUpdateDeliveryStatusDto })
  @ApiResponse({ status: 200, description: 'Delivery status updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DriverUpdateDeliveryStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.driverUpdateStatus.execute(
      user.tenantId,
      id,
      user.sub,
      body.status,
      body.pickupOtp,
    );
  }

  @Patch(':id/location')
  @ApiParam({ name: 'id', description: 'Delivery ID' })
  @ApiOperation({ summary: 'Driver updates GPS location' })
  @ApiBody({ type: UpdateDriverLocationDto })
  @ApiResponse({ status: 200, description: 'Location updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDriverLocationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.updateDriverLocation.execute(
      user.tenantId,
      id,
      user.sub,
      body.latitude,
      body.longitude,
    );
    this.gateway.notifyOrderUpdate(result.orderId, {
      type: 'driver-location',
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp: result.lastLocationUpdate.toISOString(),
    });
    return result;
  }

  @Patch(':id/complete')
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Delivery ID' })
  @ApiOperation({ summary: 'Complete delivery + mark order delivered + accrue loyalty points' })
  @ApiBody({ type: CompleteDeliveryDto })
  @ApiResponse({ status: 200, description: 'Delivery completed' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async completeDeliveryEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CompleteDeliveryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.completeDelivery.execute(user.tenantId, {
      deliveryId: id,
      deliveryOtp: body.deliveryOtp,
    }, {
      driverId: user.sub,
      role: user.role,
    });
    this.orderNotifier.notifyCustomerStatusChanged({
      tenantId: user.tenantId,
      orderId: result.orderId,
      newStatus: result.status,
    });
    if (result.paymentReleased) {
      this.orderNotifier.notifyVendorPaid({
        tenantId: user.tenantId,
        orderId: result.orderId,
        amount: result.vendorAmountCredited,
        currency: 'TZS',
      });
    }
    return result;
  }

  @Get('order/:orderId/tracking')
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOperation({ summary: 'Get delivery tracking info for an order' })
  @ApiResponse({ status: 200, description: 'Tracking info returned' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getTracking(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const tracking = await this.getDeliveryTracking.execute(orderId, { userId: user.sub, role: user.role });
    return { data: tracking };
  }
}
