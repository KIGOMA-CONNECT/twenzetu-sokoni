import { BadRequestException, Body, Controller, ForbiddenException, Get, Logger, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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
import { MobileMoneyService } from '@afri-market/integrations';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PaySupplierDto } from './dto/pay-supplier.dto';

@ApiTags('Vendor Purchase Orders')
@Controller('vendor/purchase-orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorPurchaseOrdersController {
  private readonly logger = new Logger(VendorPurchaseOrdersController.name);

  constructor(
    private readonly createOrder: CreatePurchaseOrderUseCase,
    private readonly listOrders: ListPurchaseOrdersUseCase,
    private readonly receiveOrder: ReceivePurchaseOrderUseCase,
    private readonly confirmOrder: ConfirmPurchaseOrderUseCase,
    private readonly completeOrder: CompletePurchaseOrderUseCase,
    private readonly cancelOrder: CancelPurchaseOrderUseCase,
    private readonly setPayment: SetPurchaseOrderPaymentUseCase,
    private readonly vendorAccess: VendorAccessService,
    private readonly mobileMoney: MobileMoneyService,
    @InjectDataSource() private readonly ds: DataSource,
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

    if (dto.paid) {
      throw new BadRequestException('Use POST /vendor/purchase-orders/:id/pay to pay a supplier with real funds');
    }

    return {
      data: await this.setPayment.execute({
        vendorId: ctx.vendorId,
        poId: id,
        paid: false,
      }),
    };
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Pay supplier for a purchase order (debit wallet → disburse to supplier phone)' })
  public async paySupplier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PaySupplierDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const ctx = await this.resolveContext(user);

    const poRows = await this.ds.query(
      `SELECT id, vendor_id, supplier_id, total_cost, currency, status, payment_status
       FROM purchase_orders
       WHERE id = $1 AND tenant_id = $2 AND vendor_id = $3
       LIMIT 1`,
      [id, user.tenantId, ctx.vendorId],
    );

    if (!poRows.length) {
      throw new BadRequestException('Purchase order not found');
    }

    const po = poRows[0];

    if (po.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay a cancelled purchase order');
    }

    if (po.payment_status === 'PAID') {
      throw new BadRequestException('Purchase order is already paid');
    }

    const walletRows = await this.ds.query(
      `SELECT id, balance FROM wallets WHERE owner_id = $1 AND tenant_id = $2 LIMIT 1`,
      [ctx.vendorId, user.tenantId],
    );

    if (!walletRows.length) {
      throw new BadRequestException('Vendor wallet not found');
    }

    const wallet = walletRows[0];

    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const reference = `po_payment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const currency = 'TZS';
    const balanceBefore = Number(wallet.balance);

    const debitResult = await this.ds.query(
      `UPDATE wallets SET balance = balance - $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 AND balance >= $1`,
      [dto.amount, wallet.id],
    );

    if (!debitResult[1]) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    await this.ds.query(
      `INSERT INTO wallet_transactions (id, tenant_id, wallet_id, type, amount, currency, description, reference, reference_type, balance_before, balance_after, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'debit', $3, $4, $5, $6, 'supplier_payment', $7, $8, NOW())`,
      [
        user.tenantId, wallet.id, dto.amount, currency,
        dto.description ?? `Payment to supplier for PO`,
        reference,
        balanceBefore,
        balanceBefore - dto.amount,
      ],
    );

    let paymentStatus: 'COMPLETED' | 'PENDING' | 'FAILED' = 'PENDING';
    let disbursementRef: string | null = null;

    if (dto.method !== 'bank') {
      try {
        const disburseResult = await this.mobileMoney.disburse({
          phoneNumber: dto.phoneNumber,
          amount: dto.amount,
          reference,
          description: dto.description ?? `Payment for PO`,
          provider: dto.method,
          currency,
        });

        if (disburseResult.success) {
          paymentStatus = 'COMPLETED';
          disbursementRef = disburseResult.reference ?? reference;
        } else {
          paymentStatus = 'FAILED';

          await this.ds.query(
            `UPDATE wallets SET balance = balance + $1, version = version + 1, updated_at = NOW()
             WHERE id = $2`,
            [dto.amount, wallet.id],
          );

          await this.ds.query(
            `INSERT INTO wallet_transactions (id, tenant_id, wallet_id, type, amount, currency, description, reference, reference_type, balance_before, balance_after, created_at)
             VALUES (gen_random_uuid(), $1, $2, 'credit', $3, $4, $5, $6, 'supplier_payment_refund', $7, $8, NOW())`,
            [
              user.tenantId, wallet.id, dto.amount, currency,
              `Refund: disbursement failed for ${reference}`,
              reference,
              balanceBefore - dto.amount,
              balanceBefore,
            ],
          );

          await this.ds.query(
            `INSERT INTO supplier_payments (tenant_id, vendor_id, purchase_order_id, supplier_id, amount, currency, method, phone_number, reference, status, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'FAILED', $10, NOW())`,
            [
              user.tenantId, ctx.vendorId, po.id, po.supplier_id, dto.amount, currency,
              dto.method, dto.phoneNumber, reference,
              dto.description ?? null,
            ],
          );

          throw new BadRequestException(disburseResult.message || 'Failed to disburse payment to supplier');
        }
      } catch (err) {
        if (err instanceof BadRequestException && err.message === 'Insufficient wallet balance') {
          throw err;
        }
        if (err instanceof BadRequestException && err.message.includes('disburse')) {
          throw err;
        }

        paymentStatus = 'FAILED';

        await this.ds.query(
          `UPDATE wallets SET balance = balance + $1, version = version + 1, updated_at = NOW()
           WHERE id = $2`,
          [dto.amount, wallet.id],
        );

        await this.ds.query(
          `INSERT INTO wallet_transactions (id, tenant_id, wallet_id, type, amount, currency, description, reference, reference_type, balance_before, balance_after, created_at)
           VALUES (gen_random_uuid(), $1, $2, 'credit', $3, $4, $5, $6, 'supplier_payment_refund', $7, $8, NOW())`,
          [
            user.tenantId, wallet.id, dto.amount, currency,
            `Refund: disbursement error for ${reference}`,
            reference,
            balanceBefore - dto.amount,
            balanceBefore,
          ],
        );

        await this.ds.query(
          `INSERT INTO supplier_payments (tenant_id, vendor_id, purchase_order_id, supplier_id, amount, currency, method, phone_number, reference, status, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'FAILED', $10, NOW())`,
          [
            user.tenantId, ctx.vendorId, po.id, po.supplier_id, dto.amount, currency,
            dto.method, dto.phoneNumber, reference,
            dto.description ?? null,
          ],
        );

        throw new BadRequestException('Payment disbursement failed. Wallet has been refunded.');
      }
    } else {
      paymentStatus = 'PENDING';
    }

    await this.ds.query(
      `INSERT INTO supplier_payments (tenant_id, vendor_id, purchase_order_id, supplier_id, amount, currency, method, phone_number, reference, status, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        user.tenantId, ctx.vendorId, po.id, po.supplier_id, dto.amount, currency,
        dto.method, dto.phoneNumber, reference,
        paymentStatus,
        dto.description ?? null,
      ],
    );

    await this.ds.query(
      `UPDATE purchase_orders SET payment_status = 'PAID', updated_at = NOW() WHERE id = $1`,
      [po.id],
    );

    const updatedBalance = await this.ds.query(
      `SELECT balance FROM wallets WHERE id = $1`,
      [wallet.id],
    ).then(rows => Number(rows[0].balance));

    return {
      success: true,
      reference,
      balance: updatedBalance,
      message: dto.method === 'bank'
        ? `Bank transfer of ${dto.amount} ${currency} recorded. Awaiting manual processing.`
        : `Payment of ${dto.amount} ${currency} disbursed to ${dto.phoneNumber} via ${dto.method}.`,
    };
  }
}