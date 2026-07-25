import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { EarnPointsUseCase, RedeemPointsUseCase, GetMyLoyaltyUseCase } from '@afri-market/marketplace-application';
import { EarnPointsDto } from './dto/earn-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';

@ApiTags('Loyalty')
@Controller('loyalty')
@ApiBearerAuth()
export class LoyaltyController {
  constructor(
    private readonly earnPoints: EarnPointsUseCase,
    private readonly redeemPoints: RedeemPointsUseCase,
    private readonly getMyLoyalty: GetMyLoyaltyUseCase,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user loyalty points' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getMyPointsEndpoint(@CurrentUser() user: JwtPayload) {
    const data = await this.getMyLoyalty.getPoints(user.sub);
    return { data, message: 'My points' };
  }

  @Post('earn')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Earn loyalty points from an order' })
  @ApiBody({ type: EarnPointsDto })
  @ApiResponse({ status: 201, description: 'Points earned' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async earn(@Body() dto: EarnPointsDto, @CurrentUser() user: JwtPayload) {
    return this.earnPoints.execute(user.tenantId, {
      customerId: user.sub,
      orderId: dto.orderId,
      orderTotal: dto.orderTotal,
    });
  }

  @Post('redeem')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Redeem loyalty points' })
  @ApiBody({ type: RedeemPointsDto })
  @ApiResponse({ status: 201, description: 'Points redeemed' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async redeem(@Body() dto: RedeemPointsDto, @CurrentUser() user: JwtPayload) {
    return this.redeemPoints.execute({
      customerId: user.sub,
      pointsToRedeem: dto.pointsToRedeem,
    });
  }

  @Get('tier')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user loyalty tier' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getMyTierEndpoint(@CurrentUser() user: JwtPayload) {
    const data = await this.getMyLoyalty.getTier(user.sub);
    return { data, message: 'My tier' };
  }
}
