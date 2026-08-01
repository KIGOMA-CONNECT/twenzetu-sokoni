import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { CreateDisputeUseCase, ResolveDisputeUseCase, FindMyDisputesUseCase, GetDisputeDetailUseCase } from '@afri-market/marketplace-application';
import { DisputeResolutionType } from '@afri-market/marketplace-domain';
import { CacheInvalidationInterceptor } from './cache';

@ApiTags('Disputes')
@Controller('disputes')
@ApiBearerAuth()
export class DisputesController {
  constructor(
    private readonly createDispute: CreateDisputeUseCase,
    private readonly resolveDispute: ResolveDisputeUseCase,
    private readonly findMyDisputes: FindMyDisputesUseCase,
    private readonly getDisputeDetail: GetDisputeDetailUseCase,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiOperation({ summary: 'Create a new dispute' })
  @ApiBody({ type: CreateDisputeDto })
  @ApiResponse({ status: 201, description: 'Dispute created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateDisputeDto, @CurrentUser() user: JwtPayload) {
    return this.createDispute.execute(user.tenantId, {
      orderId: dto.orderId,
      customerId: user.sub,
      vendorId: dto.vendorId ?? user.sub,
      reason: dto.reason,
      description: dto.description,
      claimAmount: dto.claimAmount,
      disputePhotoUrl: dto.disputePhotoUrl,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List current user disputes' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findMyDisputesEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.findMyDisputes.execute(user.sub, { limit, offset });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiOperation({ summary: 'Get dispute by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findOneEndpoint(@Param('id', ParseUUIDPipe) id: string) {
    return this.getDisputeDetail.execute(id);
  }

  @Patch(':id/resolve')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInvalidationInterceptor)
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiBody({ type: ResolveDisputeDto })
  @ApiResponse({ status: 200, description: 'Dispute resolved' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async resolve(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveDisputeDto) {
    return this.resolveDispute.execute({
      disputeId: id,
      resolutionType: dto.resolutionType as DisputeResolutionType,
      resolvedAmount: dto.resolvedAmount,
      notes: dto.resolutionNotes ?? '',
    });
  }
}
