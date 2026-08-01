import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
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
  CreateDeliveryCommand,
} from '@afri-market/marketplace-application';
import { MarketplaceGateway } from './gateway';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';

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
    private readonly gateway: MarketplaceGateway,
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
    return this.createDelivery.execute(user.tenantId, command);
  }

  @Get('driver/:driverId')
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiOperation({ summary: 'List deliveries by driver' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findByDriver(@Param('driverId', ParseUUIDPipe) driverId: string) {
    const deliveries = await this.findDeliveries.findByDriver(driverId);
    return { data: deliveries.map(d => d.toDto()) };
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
      body.driverEarnings,
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
    this.gateway.notifyOrderUpdate(result.deliveryId, {
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
    return this.completeDelivery.execute(user.tenantId, {
      deliveryId: id,
      driverEarnings: body.driverEarnings ?? 0,
      deliveryOtp: body.deliveryOtp,
    });
  }

  @Get('order/:orderId/tracking')
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOperation({ summary: 'Get delivery tracking info for an order' })
  @ApiResponse({ status: 200, description: 'Tracking info returned' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getTracking(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const tracking = await this.getDeliveryTracking.execute(orderId);
    return { data: tracking };
  }
}
