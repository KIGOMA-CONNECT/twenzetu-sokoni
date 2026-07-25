import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { RegisterVehicleDto } from './dto/register-vehicle.dto';
import { UpdateVehicleLocationDto } from './dto/update-vehicle-location.dto';
import {
  RegisterVehicleUseCase,
  UpdateVehicleLocationUseCase,
  ListDriverVehiclesUseCase,
} from '@afri-market/marketplace-application';

@ApiTags('Fleet')
@Controller('fleet/vehicles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VehiclesController {
  constructor(
    private readonly registerVehicle: RegisterVehicleUseCase,
    private readonly updateLocation: UpdateVehicleLocationUseCase,
    private readonly listDriverVehicles: ListDriverVehiclesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new vehicle' })
  @ApiBody({ type: RegisterVehicleDto })
  @ApiResponse({ status: 201, description: 'Vehicle registered' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async register(
    @CurrentUser() user: JwtPayload,
    @Body() body: RegisterVehicleDto,
  ) {
    const vehicle = await this.registerVehicle.execute(user.tenantId, {
      driverId: user.sub,
      ...body,
    });
    return { data: vehicle };
  }

  @Patch(':id/location')
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiOperation({ summary: 'Update vehicle location' })
  @ApiBody({ type: UpdateVehicleLocationDto })
  @ApiResponse({ status: 200, description: 'Location updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async updateVehicleLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateVehicleLocationDto,
  ) {
    const result = await this.updateLocation.execute(id, body.latitude, body.longitude);
    return { data: result };
  }

  @Get('me')
  @ApiOperation({ summary: 'List my vehicles' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getMyVehicles(@CurrentUser() user: JwtPayload) {
    const vehicles = await this.listDriverVehicles.execute(user.sub);
    return { data: vehicles };
  }
}
