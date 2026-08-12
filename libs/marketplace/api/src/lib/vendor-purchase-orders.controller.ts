import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  CreatePurchaseOrderUseCase,
  ListPurchaseOrdersUseCase,
  ReceivePurchaseOrderUseCase,
  ConfirmPurchaseOrderUseCase,
  CompletePurchaseOrderUseCase,
  CancelPurchaseOrderUseCase,
  SetPurchaseOrderPaymentUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@ApiTags('Vendor Purchase Orders')
@Controller('vendor/purchase-orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorPurchaseOrdersController {
  constructor(
    private readonly createOrder: CreatePurchaseOrderUseCase,
    private readonly listOrders: ListPurchaseOrdersUseCase,
    private readonly receiveOrder: ReceivePurchaseOrderUseCase,
    private readonly confirmOrder: ConfirmPurchaseOrderUseCase,
    private readonly completeOrder: CompletePurchaseOrderUseCase,
    private readonly cancelOrder: CancelPurchaseOrderUseCase,
    private readonly setPayment: SetPurchaseOrderPaymentUseCase,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  private async resolveContext(user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'manage_products');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to manage inventory');
    }
    return ctx;
  }

  @Get()
  @ApiOperation({ summary: 'List purchase orders for the vendor (requires manage_products)' })
  public async list(@CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    return { data: await this.listOrders.execute(ctx.vendorId) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a purchase order with costed items (requires manage_products)' })
  public async create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    try {
      return await this.createOrder.execute({
        tenantId: user.tenantId,
        vendorId: ctx.vendorId,
        operatorId: user.sub,
        supplierId: dto.supplierId,
        items: dto.items,
        notes: dto.notes,
      });
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive a purchase order and restock products automatically' })
  public async receive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    try {
      return { data: await this.receiveOrder.execute({ vendorId: ctx.vendorId, poId: id }) };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a received purchase order' })
  public async confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    try {
      return { data: await this.confirmOrder.execute({ vendorId: ctx.vendorId, poId: id }) };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a confirmed purchase order' })
  public async complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    try {
      return { data: await this.completeOrder.execute({ vendorId: ctx.vendorId, poId: id }) };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an open purchase order' })
  public async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    try {
      return { data: await this.cancelOrder.execute({ vendorId: ctx.vendorId, poId: id }) };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Mark a purchase order paid/unpaid' })
  public async payment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { paid?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    const ctx = await this.resolveContext(user);
    return {
      data: await this.setPayment.execute({
        vendorId: ctx.vendorId,
        poId: id,
        paid: dto.paid ?? false,
      }),
    };
  }
}