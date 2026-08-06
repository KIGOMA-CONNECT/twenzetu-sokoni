import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateAddressUseCase, ListAddressesUseCase, DeleteAddressUseCase, SetDefaultAddressUseCase } from '@afri-market/marketplace-application';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AddressesController {
  constructor(
    private readonly createAddress: CreateAddressUseCase,
    private readonly listAddresses: ListAddressesUseCase,
    private readonly deleteAddress: DeleteAddressUseCase,
    private readonly setDefaultAddress: SetDefaultAddressUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'List current user addresses' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findMyAddresses(@CurrentUser() user: JwtPayload) {
    const data = await this.listAddresses.execute(user.sub);
    return { data: data.map(a => a.toDto()) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({ status: 201, description: 'Address created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateAddressDto, @CurrentUser() user: JwtPayload) {
    return this.createAddress.execute(user.tenantId, {
      userId: user.sub,
      ...dto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.deleteAddress.execute(id, user.sub);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set an address as default' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address set as default' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async setDefault(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.setDefaultAddress.execute(id, user.sub);
  }
}
