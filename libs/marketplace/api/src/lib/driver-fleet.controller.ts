import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import {
  BulkSetDriverStatusUseCase,
  BulkVerifyDriversUseCase,
  ToggleDriverAvailabilityUseCase,
} from '@afri-market/marketplace-application';
import { DataSource } from 'typeorm';
import { BulkSetDriverStatusDto, BulkVerifyDriversDto } from './dto/bulk-fleet-ops.dto';

@ApiTags('Driver Fleet')
@Controller('driver-fleet')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DriverFleetController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly toggleDriverAvailability: ToggleDriverAvailabilityUseCase,
    private readonly bulkVerifyDrivers: BulkVerifyDriversUseCase,
    private readonly bulkSetDriverStatus: BulkSetDriverStatusUseCase,
  ) {}

  @Patch(':vehicleId/availability')
  @ApiOperation({ summary: 'Toggle driver online/offline status' })
  public async toggleOnline(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body('isOnline') isOnline: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.toggleDriverAvailability.execute(user.tenantId, vehicleId, user.sub, isOnline);
    return { data: result };
  }

  @Get('stats/:driverId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get driver performance metrics (admin only)' })
  public async getDriverStats(@Param('driverId', ParseUUIDPipe) driverId: string, @CurrentUser() user: JwtPayload) {
    const deliveryRepo = this.dataSource.getRepository('deliveries');
    const [completedDeliveries, totalDeliveries] = await Promise.all([
      deliveryRepo.count({ where: { driverId, status: 'DELIVERED', tenantId: user.tenantId } }),
      deliveryRepo.count({ where: { driverId, tenantId: user.tenantId } }),
    ]);

    const reviewRepo = this.dataSource.getRepository('driver_reviews');
    const ratingResult = await reviewRepo
      .createQueryBuilder('r')
      .where('r.driverId = :driverId', { driverId })
      .andWhere('r.tenantId = :tenantId', { tenantId: user.tenantId })
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .getRawOne();

    const earningsResult = await this.dataSource
      .createQueryBuilder()
      .select('SUM(driver_earnings)', 'total')
      .from('deliveries', 'd')
      .where('d.driver_id = :driverId', { driverId })
      .andWhere('d.status = :status', { status: 'DELIVERED' })
      .andWhere('d.tenant_id = :tenantId', { tenantId: user.tenantId })
      .getRawOne();

    return {
      data: {
        driverId,
        completedDeliveries,
        totalDeliveries,
        onTimeRate: totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0,
        averageRating: ratingResult?.avg ? Number(Number(ratingResult.avg).toFixed(1)) : null,
        totalRatings: Number(ratingResult?.count ?? 0),
        totalEarnings: Number(earningsResult?.total ?? 0),
        currency: 'TZS',
      },
    };
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all drivers with vehicle info (admin only)' })
  public async listDrivers(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    const userRepo = this.dataSource.getRepository('users');
    const query = userRepo.createQueryBuilder('u')
      .where('u.tenant_id = :tenantId', { tenantId: user.tenantId })
      .andWhere('u.role = :role', { role: 'driver' })
      .leftJoin('vehicles', 'v', 'v.driver_id = u.id AND v.tenant_id = u.tenant_id');

    if (status) {
      query.andWhere('u.status = :status', { status });
    }

    const drivers = await query
      .select([
        'u.id', 'u.phone_number', 'u.full_name', 'u.status', 'u.created_at',
        'v.id as vehicle_id', 'v.vehicle_type', 'v.plate_number', 'v.is_available',
        'v.is_online', 'v.verified_at',
      ])
      .orderBy('u.created_at', 'DESC')
      .getRawMany();

    return { data: drivers.map((d) => ({
      id: d.u_id, phoneNumber: d.u_phone_number, fullName: d.u_full_name,
      status: d.u_status, createdAt: d.u_created_at,
      vehicleId: d.vehicle_id, vehicleType: d.v_vehicle_type,
      plateNumber: d.v_plate_number, isAvailable: d.v_is_available,
      isOnline: d.v_is_online, verifiedAt: d.v_verified_at,
    })) };
  }

  @Patch(':driverId/verify')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve driver verification (admin only)' })
  public async verifyDriver(@Param('driverId', ParseUUIDPipe) driverId: string, @CurrentUser() user: JwtPayload) {
    const userRepo = this.dataSource.getRepository('users');
    const driver = await userRepo.findOne({ where: { id: driverId, tenantId: user.tenantId } });
    if (!driver) throw new Error('Driver not found');
    driver.status = 'ACTIVE';
    await userRepo.save(driver);

    const vehicleRepo = this.dataSource.getRepository('vehicles');
    await vehicleRepo.update({ driverId, tenantId: user.tenantId }, { verifiedAt: new Date() });

    return { success: true, message: 'Driver verified' };
  }

  @Post('bulk/verify')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Verify a batch of drivers (admin only)' })
  public async bulkVerify(@Body() dto: BulkVerifyDriversDto, @CurrentUser() user: JwtPayload) {
    const result = await this.bulkVerifyDrivers.execute(user.tenantId, dto.driverIds);
    return { data: result };
  }

  @Post('bulk/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk activate/suspend drivers (admin only)' })
  public async bulkStatus(@Body() dto: BulkSetDriverStatusDto, @CurrentUser() user: JwtPayload) {
    const result = await this.bulkSetDriverStatus.execute(user.tenantId, dto.driverIds, dto.status);
    return { data: result };
  }
}
