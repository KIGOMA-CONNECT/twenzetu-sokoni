import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { ReleasePaymentUseCase, ListPaymentsUseCase, GetPaymentByOrderUseCase, VendorAccessService } from '@afri-market/marketplace-application';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';
import { OrderNotifierService } from './order-notifier.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly releasePayment: ReleasePaymentUseCase,
    private readonly listPayments: ListPaymentsUseCase,
    private readonly getPaymentByOrder: GetPaymentByOrderUseCase,
    private readonly orderNotifier: OrderNotifierService,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  private async resolveCallerVendorId(user: JwtPayload): Promise<string | undefined> {
    if (user.role === 'vendor') {
      const ctx = await this.vendorAccess.resolve(user);
      if (ctx) return ctx.vendorId;
    }
    return undefined;
  }

  @Get('order/:orderId')
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOperation({ summary: 'Get payment for an order' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findByOrder(
    @CurrentUser() user: JwtPayload,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const payment = await this.getPaymentByOrder.execute(user.tenantId, orderId);
    return { data: payment };
  }

  @Post(':orderId/release')
  @UseInterceptors(CacheInvalidationInterceptor)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOperation({ summary: 'Release escrowed payment to vendor wallet' })
  @ApiResponse({ status: 201, description: 'Payment released' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async release(
    @CurrentUser() user: JwtPayload,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const vendorId = await this.resolveCallerVendorId(user);
    const result = await this.releasePayment.execute(user.tenantId, orderId, {
      userId: user.sub,
      role: user.role,
      vendorId,
    });
    this.orderNotifier.notifyVendorPaid({
      tenantId: user.tenantId,
      orderId,
      amount: result.vendorNetCredited,
      currency: 'TZS',
    });
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List payments with optional filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit: limit ? Number(limit) : undefined, offset: offset ? Number(offset) : undefined });
    const result = await this.listPayments.execute(user.tenantId, {
      status,
      vendorId,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return paginatedResult(result.data, result.total, parsedLimit, parsedOffset);
  }
}
