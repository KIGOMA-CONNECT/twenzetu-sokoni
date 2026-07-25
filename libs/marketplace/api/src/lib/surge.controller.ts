import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateSurgeRuleDto } from './dto/create-surge-rule.dto';
import { SurgeCalculateQueryDto } from './dto/surge-calculate-query.dto';
import { CalculateSurgeUseCase, CreateSurgeRuleUseCase, ListSurgeRulesUseCase } from '@afri-market/marketplace-application';

@ApiTags('Surge Pricing')
@Controller('surge')
@ApiBearerAuth()
export class SurgeController {
  constructor(
    private readonly calculateSurge: CalculateSurgeUseCase,
    private readonly createSurgeRule: CreateSurgeRuleUseCase,
    private readonly listSurgeRules: ListSurgeRulesUseCase,
  ) {}

  @Post('rules')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a surge pricing rule' })
  @ApiBody({ type: CreateSurgeRuleDto })
  @ApiResponse({ status: 201, description: 'Surge rule created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async createRule(@Body() dto: CreateSurgeRuleDto, @CurrentUser() user: JwtPayload) {
    return this.createSurgeRule.execute(user.tenantId, {
      name: dto.name,
      trigger: dto.trigger,
      multiplier: dto.multiplier,
      minOrders: dto.minOrders,
      maxDrivers: dto.maxDrivers,
      startHour: dto.startHour,
      endHour: dto.endHour,
    });
  }

  @Get('rules')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List active surge pricing rules' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findActiveRules(@CurrentUser() user: JwtPayload) {
    return this.listSurgeRules.execute(user.tenantId);
  }

  @Get('calculate')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Calculate surge pricing for a trip' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async calculate(
    @Query() query: SurgeCalculateQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.calculateSurge.execute(user.tenantId, {
      baseFare: query.baseFare,
      distanceKm: query.distanceKm,
      perKmRate: query.perKmRate,
      durationMinutes: query.durationMinutes ?? 0,
      perMinuteRate: query.perMinuteRate ?? 0,
    });
  }
}
