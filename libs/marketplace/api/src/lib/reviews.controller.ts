import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EntityId } from '@afri-market/kernel';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { IReviewRepository, IOrderRepository } from '@afri-market/marketplace-domain';
import { REVIEW_REPOSITORY, ORDER_REPOSITORY } from '@afri-market/marketplace-application';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewUseCase, CreateReviewCommand, FindReviewsByVendorUseCase, FindMyReviewedOrdersUseCase } from '@afri-market/marketplace-application';
import { CacheInvalidationInterceptor } from './cache';

@ApiTags('Reviews')
@Controller('reviews')
@ApiBearerAuth()
export class ReviewsController {
  constructor(
    private readonly createReview: CreateReviewUseCase,
    private readonly findReviewsByVendor: FindReviewsByVendorUseCase,
    private readonly findMyReviewedOrders: FindMyReviewedOrdersUseCase,
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: IReviewRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Create a new review' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateReviewDto, @CurrentUser() user: JwtPayload) {
    const command = new CreateReviewCommand(
      user.sub,
      dto.vendorId,
      dto.orderId,
      dto.rating,
      dto.comment,
    );
    return this.createReview.execute(user.tenantId, command);
  }

  @Get('me/orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get the set of order IDs the current user has already reviewed' })
  @ApiResponse({ status: 200, description: 'Reviewed order IDs' })
  public async findMyReviewedOrdersEndpoint(@CurrentUser() user: JwtPayload) {
    return this.findMyReviewedOrders.execute(user.sub);
  }

  @Get('order/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOperation({ summary: 'Get my review for an order (or null)' })
  @ApiResponse({ status: 200, description: 'Review or null' })
  public async findByOrderEndpoint(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.orderRepo.findById(EntityId.from(orderId));
    if (!order || order.customerId.value !== user.sub) {
      return { data: null };
    }
    const review = await this.reviewRepo.findByOrderId(orderId);
    return { data: review ? { id: review.id.value, rating: review.rating, comment: review.comment ?? '' } : null };
  }

  @Get('vendor/:vendorId')
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiOperation({ summary: 'List reviews by vendor' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findByVendorEndpoint(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.findReviewsByVendor.execute(vendorId, { limit, offset });
  }
}
