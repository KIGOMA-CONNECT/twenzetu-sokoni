import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreatePoiDto } from './dto/create-poi.dto';
import { PoiNearbyQueryDto } from './dto/poi-nearby-query.dto';
import { CreatePoiUseCase, FindNearbyPoiUseCase } from '@afri-market/marketplace-application';
import { PoiType } from '@afri-market/marketplace-domain';

@ApiTags('Points of Interest')
@Controller('poi')
@ApiBearerAuth()
export class PoiController {
  constructor(
    private readonly createPoi: CreatePoiUseCase,
    private readonly findNearbyPoi: FindNearbyPoiUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new point of interest' })
  @ApiBody({ type: CreatePoiDto })
  @ApiResponse({ status: 201, description: 'POI created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async createPoiEndpoint(@Body() dto: CreatePoiDto, @CurrentUser() user: JwtPayload) {
    return this.createPoi.execute(user.tenantId, {
      name: dto.name,
      localName: dto.localName,
      description: dto.description,
      type: dto.type,
      latitude: dto.latitude,
      longitude: dto.longitude,
      streetAddress: dto.streetAddress,
      landmarkDescription: dto.landmarkDescription,
      submittedBy: user.sub,
      source: 'USER_SUBMITTED',
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby points of interest' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findNearby(
    @Query() query: PoiNearbyQueryDto,
  ) {
    const results = await this.findNearbyPoi.execute({
      latitude: query.lat,
      longitude: query.lng,
      radiusKm: query.radiusKm ?? 5,
    });
    return { data: results };
  }

  @Get('type/:type')
  @ApiParam({ name: 'type', description: 'POI type' })
  @ApiOperation({ summary: 'List points of interest by type' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findByType(@Param('type') type: string) {
    const results = await this.findNearbyPoi.execute({
      latitude: 0,
      longitude: 0,
      radiusKm: 9999,
      type: type as PoiType,
    });
    return { data: results };
  }
}
