import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateBulkOrderDto } from './dto/create-bulk-order.dto';
import { CreateBulkOrderUseCase, JoinBulkOrderUseCase, ListActiveBulkOrdersUseCase } from '@afri-market/marketplace-application';

@ApiTags('B2B')
@Controller('b2b')
@ApiBearerAuth()
export class B2bController {
  constructor(
    private readonly createBulkOrder: CreateBulkOrderUseCase,
    private readonly joinBulkOrder: JoinBulkOrderUseCase,
    private readonly listActiveBulkOrders: ListActiveBulkOrdersUseCase,
  ) {}

  @Post('bulk-orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a bulk order' })
  @ApiBody({ type: CreateBulkOrderDto })
  @ApiResponse({ status: 201, description: 'Bulk order created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async createBulkOrderEndpoint(@Body() dto: CreateBulkOrderDto, @CurrentUser() user: JwtPayload) {
    return this.createBulkOrder.execute(user.tenantId, {
      sourceType: dto.sourceType,
      sourceName: dto.sourceName,
      sourcePhone: dto.sourcePhone,
      productName: dto.productName,
      totalQuantity: dto.totalQuantity,
      unit: dto.unit,
      totalAmount: dto.totalAmount,
    });
  }

  @Get('bulk-orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List active bulk orders' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findActiveEndpoint(@CurrentUser() user: JwtPayload) {
    return this.listActiveBulkOrders.execute(user.tenantId);
  }

  @Post('bulk-orders/:id/join')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Bulk Order ID' })
  @ApiOperation({ summary: 'Join a bulk order' })
  @ApiResponse({ status: 201, description: 'Joined bulk order' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async joinBulkOrderEndpoint(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.joinBulkOrder.execute({
      bulkOrderId: id,
      vendorId: user.sub,
    });
  }
}
