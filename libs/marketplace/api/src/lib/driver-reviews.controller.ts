import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  CreateDriverReviewUseCase,
  ListDriverReviewsUseCase,
  CreateDriverReviewCommand,
} from '@afri-market/marketplace-application';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';

@ApiTags('Driver Reviews')
@Controller('driver-reviews')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DriverReviewsController {
  constructor(
    private readonly createDriverReview: CreateDriverReviewUseCase,
    private readonly listDriverReviews: ListDriverReviewsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Rate the driver for a delivered order (cargo/express)' })
  @ApiBody({ type: CreateDriverReviewDto })
  @ApiResponse({ status: 201, description: 'Driver review created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateDriverReviewDto, @CurrentUser() user: JwtPayload) {
    const command: CreateDriverReviewCommand = {
      orderId: dto.orderId,
      rating: dto.rating,
      comment: dto.comment,
    };
    return this.createDriverReview.execute(user.tenantId, user.sub, command);
  }

  @Get('driver/:driverId')
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOperation({ summary: 'List driver reviews with average rating' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async byDriver(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.listDriverReviews.byDriver(user.tenantId, driverId, {
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
    return { data: result };
  }

  @Get('delivery/:deliveryId')
  @ApiParam({ name: 'deliveryId', description: 'Delivery ID' })
  @ApiOperation({ summary: 'Get the customer review for a delivery (or null)' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async byDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const review = await this.listDriverReviews.byDelivery(user.tenantId, deliveryId);
    return { data: review };
  }
}
