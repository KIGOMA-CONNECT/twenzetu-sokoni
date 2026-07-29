import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, Logger,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';

import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsIn, IsUUID, MinLength } from 'class-validator';

class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsIn(['weekly', 'biweekly', 'monthly'])
  frequency!: string;

  @IsOptional()
  @IsNumber()
  dayOfWeek?: number;

  @IsOptional()
  @IsNumber()
  dayOfMonth?: number;

  @IsString()
  @IsNotEmpty()
  nextOrderDate!: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  deliveryAddressId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateSubscriptionDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @IsIn(['weekly', 'biweekly', 'monthly'])
  frequency?: string;

  @IsOptional()
  @IsNumber()
  dayOfWeek?: number;

  @IsOptional()
  @IsNumber()
  dayOfMonth?: number;

  @IsOptional()
  @IsString()
  nextOrderDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'PAUSED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  deliveryAddressId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateSubscriptionDto) {
    const vendor = await this.ds.query(
      `SELECT id FROM vendors WHERE id = $1 AND tenant_id = $2`,
      [body.vendorId, user.tenantId],
    );
    if (vendor.length === 0) {
      throw new BadRequestException('Vendor not found');
    }

    const product = await this.ds.query(
      `SELECT id, price FROM products WHERE id = $1 AND vendor_id = $2`,
      [body.productId, body.vendorId],
    );
    if (product.length === 0) {
      throw new BadRequestException('Product not found for this vendor');
    }

    const result = await this.ds.query(
      `INSERT INTO subscriptions (tenant_id, user_id, vendor_id, product_id, quantity, frequency, day_of_week, day_of_month, next_order_date, delivery_address_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        user.tenantId, user.sub, body.vendorId, body.productId, body.quantity,
        body.frequency, body.dayOfWeek ?? null, body.dayOfMonth ?? null,
        body.nextOrderDate, body.deliveryAddressId ?? null, body.notes ?? null,
      ],
    );

    return { id: result[0].id, message: 'Subscription created' };
  }

  @Get()
  @ApiOperation({ summary: 'List my subscriptions' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    let query = `
      SELECT s.*, p.name as product_name, p.price as product_price, p.image_url,
             v.shop_name as vendor_name,
             a.label as address_label, a.full_address as address_full
      FROM subscriptions s
      LEFT JOIN products p ON p.id = s.product_id
      LEFT JOIN vendors v ON v.id = s.vendor_id
      LEFT JOIN addresses a ON a.id = s.delivery_address_id
      WHERE s.user_id = $1 AND s.tenant_id = $2
    `;
    const params: any[] = [user.sub, user.tenantId];

    if (status) {
      query += ` AND s.status = $3`;
      params.push(status);
    }

    query += ` ORDER BY s.created_at DESC`;

    const rows = await this.ds.query(query, params);
    return { data: rows };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const rows = await this.ds.query(
      `SELECT s.*, p.name as product_name, p.price as product_price, p.image_url,
              v.shop_name as vendor_name,
a.label as address_label, a.full_address as address_full
       FROM subscriptions s
       LEFT JOIN products p ON p.id = s.product_id
       LEFT JOIN vendors v ON v.id = s.vendor_id
       LEFT JOIN addresses a ON a.id = s.delivery_address_id
       WHERE s.id = $1 AND s.user_id = $2 AND s.tenant_id = $3`,
      [id, user.sub, user.tenantId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Subscription not found');
    }
    return rows[0];
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription (pause, resume, change frequency, etc.)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateSubscriptionDto,
  ) {
    const existing = await this.ds.query(
      `SELECT id FROM subscriptions WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [id, user.sub, user.tenantId],
    );
    if (existing.length === 0) {
      throw new NotFoundException('Subscription not found');
    }

    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (body.quantity !== undefined) { fields.push(`quantity = $${idx++}`); params.push(body.quantity); }
    if (body.frequency !== undefined) { fields.push(`frequency = $${idx++}`); params.push(body.frequency); }
    if (body.dayOfWeek !== undefined) { fields.push(`day_of_week = $${idx++}`); params.push(body.dayOfWeek); }
    if (body.dayOfMonth !== undefined) { fields.push(`day_of_month = $${idx++}`); params.push(body.dayOfMonth); }
    if (body.nextOrderDate !== undefined) { fields.push(`next_order_date = $${idx++}`); params.push(body.nextOrderDate); }
    if (body.status !== undefined) { fields.push(`status = $${idx++}`); params.push(body.status); }
    if (body.deliveryAddressId !== undefined) { fields.push(`delivery_address_id = $${idx++}`); params.push(body.deliveryAddressId); }
    if (body.notes !== undefined) { fields.push(`notes = $${idx++}`); params.push(body.notes); }

    if (fields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    params.push(id);
    await this.ds.query(
      `UPDATE subscriptions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      params,
    );

    return { message: 'Subscription updated' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a subscription' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const existing = await this.ds.query(
      `SELECT id FROM subscriptions WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [id, user.sub, user.tenantId],
    );
    if (existing.length === 0) {
      throw new NotFoundException('Subscription not found');
    }

    await this.ds.query(
      `UPDATE subscriptions SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    return { message: 'Subscription cancelled' };
  }
}
