import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewUseCase, CreateReviewCommand, FindReviewsByVendorUseCase } from '@afri-market/marketplace-application';
import { CacheInvalidationInterceptor } from './cache';

@ApiTags('Reviews')
@Controller('reviews')
@ApiBearerAuth()
export class ReviewsController {
  constructor(
    private readonly createReview: CreateReviewUseCase,
    private readonly findReviewsByVendor: FindReviewsByVendorUseCase,
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
