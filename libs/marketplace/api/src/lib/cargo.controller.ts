import { Body, Controller, Get, Post, Query, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EntityId, Money } from '@afri-market/kernel';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { getCurrencyForPhone } from '@afri-market/integrations';
import {
  IVendorRepository,
  IServiceListingRepository,
  IServiceRequestRepository,
  CargoFareCalculator,
  haversineKm,
} from '@afri-market/marketplace-domain';
import {
  VENDOR_REPOSITORY,
  SERVICE_LISTING_REPOSITORY,
  SERVICE_REQUEST_REPOSITORY,
  CreateServiceRequestUseCase,
  CreateServiceRequestCommand,
  CreateOrderUseCase,
  CreateOrderCommand,
} from '@afri-market/marketplace-application';
import { CreateCargoRequestDto, CargoFareQueryDto } from './dto/create-cargo-request.dto';

const CARGO_PAYMENT_METHODS = [
  'wallet',
  'card',
  'mpesa',
  'tigo_money',
  'tigo_pesa',
  'airtel_money',
  'halotel',
  'azampesa',
  'cash',
];

@ApiTags('Cargo')
@ApiBearerAuth()
@Controller('cargo')
export class CargoController {
  private readonly logger = new Logger(CargoController.name);

  constructor(
    private readonly createRequest: CreateServiceRequestUseCase,
    private readonly createOrder: CreateOrderUseCase,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Get('fare')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Live cargo fare quote (server-computed, binding)' })
  @ApiResponse({ status: 200, description: 'Fare breakdown' })
  @ApiResponse({ status: 400, description: 'Invalid input (e.g. weight exceeds vehicle capacity)' })
  public async getFare(@Query() query: CargoFareQueryDto, @CurrentUser() user: JwtPayload) {
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
        currency: getCurrencyForPhone(user.phoneNumber),
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  @Post('requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Book cargo instantly: server-computed binding fare + payment (wallet/card/mobile money/cash)' })
  @ApiBody({ type: CreateCargoRequestDto })
  @ApiResponse({ status: 201, description: 'Booking created with payment initiated' })
  public async book(@Body() dto: CreateCargoRequestDto, @CurrentUser() user: JwtPayload) {
    const paymentMethod = dto.paymentMethod ?? 'mpesa';
    if (!CARGO_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new BadRequestException('Njia ya malipo haitambuliki');
    }

    const distanceKm = haversineKm(dto.pickup.lat, dto.pickup.lng, dto.delivery.lat, dto.delivery.lng);
    const currency = getCurrencyForPhone(user.phoneNumber);
    let fare;
    try {
      fare = CargoFareCalculator.calculate({
        distanceKm,
        weightKg: dto.weightKg,
        vehicleType: dto.vehicle,
        tripType: dto.tripType ?? 'instant',
        insured: dto.insured === true,
        cargoValue: dto.cargoValue,
        currency,
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }

    const { data: cargoListings } = await this.listingRepo.findActive(user.tenantId, { category: 'cargo', limit: 1 });
    let vendorId: string;
    let listingId: string | undefined;

    if (cargoListings.length > 0) {
      vendorId = cargoListings[0].vendorId.value;
      listingId = cargoListings[0].id.value;
    } else {
      const vendors = await this.vendorRepo.findActiveByTenant(user.tenantId);
      if (vendors.length === 0) {
        throw new BadRequestException('Hakuna mtoa huduma wa usafirishaji kwa sasa. Jaribu tena baadaye.');
      }
      vendorId = vendors[0].id.value;
    }

    const route = `${dto.pickup.address} → ${dto.delivery.address}`;
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const details = [
      `Huduma: ${dto.subServiceName}`,
      `Usafiri: ${fare.emoji} ${fare.vehicleName}`,
      `Njia: ${route}`,
      `Umbali: ${fare.distanceKm} km`,
      `Uzito: ${dto.weightKg} kg`,
      `Mpango: ${dto.tripType === 'scheduled' ? (scheduledAt ? `Ratiba: ${scheduledAt.toISOString()}` : 'Ratiba itabainishwa baadaye') : 'Haraka'}`,
      `Bima ya mzigo: ${dto.insured ? `Ndiyo (Tsh ${fare.insuranceFee.toLocaleString('sw-TZ')})` : 'Hapana'}`,
      `Nauli (inayofunga): Tsh ${fare.totalFare.toLocaleString('sw-TZ')}`,
      dto.notes ? `Maelezo: ${dto.notes}` : undefined,
    ].filter(Boolean).join('\n');

    const { requestId } = await this.createRequest.execute(
      user.tenantId,
      new CreateServiceRequestCommand(
        user.sub,
        vendorId,
        listingId,
        `${dto.subServiceName} — ${fare.vehicleName}`,
        1,
        'trip',
        details,
        [],
        currency,
        scheduledAt,
      ),
    );

    const request = await this.requestRepo.findById(EntityId.from(requestId));
    if (!request) {
      throw new BadRequestException('Ombi halikuweza kuundwa');
    }
    request.agree(Money.create(fare.totalFare, currency));
    await this.requestRepo.save(request);

    const orderResult = await this.createOrder.execute(
      user.tenantId,
      new CreateOrderCommand(
        user.sub,
        vendorId,
        'service',
        route,
        [
          {
            productId: requestId,
            productName: `${dto.subServiceName} — ${fare.vehicleName}`,
            quantity: 1,
            unitPrice: fare.totalFare,
          },
        ],
        paymentMethod,
        dto.delivery.lat,
        dto.delivery.lng,
        `CargoBooking|${dto.subServiceName}|${fare.vehicleName}|${dto.weightKg}kg`,
        user.phoneNumber,
        undefined,
        currency,
      ),
    );

    request.markOrdered();
    request.linkOrder(EntityId.from(orderResult.orderId));
    await this.requestRepo.save(request);

    // Paid transport orders (wallet/cash are settled synchronously) become
    // ready for driver pickup immediately; mobile money/card wait for the
    // payment webhook which promotes them via ConfirmPaymentUseCase.
    if (orderResult.paymentStatus === 'ESCROW_HELD') {
      await this.ds.query(
        `UPDATE orders SET status = 'READY_FOR_PICKUP', updated_at = NOW() WHERE id = $1`,
        [orderResult.orderId],
      );
    }

    const paid = orderResult.paymentStatus === 'ESCROW_HELD';
    const message = paid
      ? 'Usafirishaji umelipwa. Tunaandaa pickup ya mzigo wako.'
      : paymentMethod === 'card'
        ? 'Kamilisha malipo ya kadi kupitia link iliyotumwa.'
        : 'Malipo hayajathibitishwa bado. Thibitisha STK push kwenye simu yako.';

    return {
      success: paid,
      requestId,
      orderId: orderResult.orderId,
      fare: fare.totalFare,
      fareBreakdown: fare.breakdown,
      distanceKm: fare.distanceKm,
      vehicle: fare.vehicleName,
      capacityKg: fare.capacityKg,
      paymentMethod,
      paymentStatus: orderResult.paymentStatus,
      checkoutUrl: orderResult.checkoutUrl,
      message,
    };
  }
}
