import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuUseCase, ListMenusUseCase } from '@afri-market/marketplace-application';

@ApiTags('Menus')
@Controller('menus')
export class MenusController {
  constructor(
    private readonly createMenu: CreateMenuUseCase,
    private readonly listMenus: ListMenusUseCase,
  ) {}

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'List active menus for a vendor' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findByVendor(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    const data = await this.listMenus.execute(vendorId);
    return { data: data.map(m => m.toDto()) };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new menu' })
  @ApiBody({ type: CreateMenuDto })
  @ApiResponse({ status: 201, description: 'Menu created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateMenuDto, @CurrentUser() user: JwtPayload) {
    return this.createMenu.execute(user.tenantId, dto);
  }
}
