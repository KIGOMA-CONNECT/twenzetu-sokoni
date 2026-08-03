import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedRequestUser } from '@abms/identity-infrastructure';

@Controller('laundry')
export class LaundryController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get('pricing')
  public async listPricing() {
    const pricing = await this.ds.query(
      `SELECT id, clothing_type, wash_price, dry_clean_price, iron_only_price, currency
       FROM laundry_pricing WHERE is_active = true ORDER BY clothing_type`
    );
    return { success: true, data: pricing };
  }

  @Post('requests')
  @UseGuards(AuthGuard('jwt'))
  public async createRequest(
    @Req() request: { user: AuthenticatedRequestUser },
    @Body() body: {
      description?: string;
      pickupAddress?: string;
      deliveryAddress?: string;
      pickupDate?: string;
      pickupTime?: string;
      photoUrls?: string[];
      items?: { clothingType: string; quantity: number; notes?: string }[];
    },
  ) {
    const { user } = request;
    const result = await this.ds.query(
      `INSERT INTO laundry_requests (tenant_id, customer_id, description, pickup_address, delivery_address, pickup_date, pickup_time, photo_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.tenantId, user.userId, body.description || '', body.pickupAddress || '', body.deliveryAddress || '', body.pickupDate || null, body.pickupTime || null, body.photoUrls || []],
    );
    const requestId = result[0].id;
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        const [priceRow] = await this.ds.query(
          `SELECT wash_price, dry_clean_price FROM laundry_pricing WHERE clothing_type = $1 AND is_active = true LIMIT 1`,
          [item.clothingType],
        );
        const unitPrice = priceRow ? parseFloat(priceRow.wash_price) : 0;
        await this.ds.query(
          `INSERT INTO laundry_request_items (request_id, clothing_type, quantity, unit_price, subtotal, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [requestId, item.clothingType, item.quantity, unitPrice, unitPrice * item.quantity, item.notes || ''],
        );
      }
    }
    const [full] = await this.ds.query(
      `SELECT * FROM laundry_requests WHERE id = $1`,
      [requestId],
    );
    const items = await this.ds.query(
      `SELECT * FROM laundry_request_items WHERE request_id = $1`,
      [requestId],
    );
    return { success: true, data: { ...full, items } };
  }

  @Get('requests')
  @UseGuards(AuthGuard('jwt'))
  public async listRequests(@Req() request: { user: AuthenticatedRequestUser }) {
    const { user } = request;
    const requests = await this.ds.query(
      `SELECT lr.*, u.full_name as customer_name
       FROM laundry_requests lr
       LEFT JOIN users u ON lr.customer_id = u.id
       WHERE lr.status = 'OPEN' AND lr.customer_id != $1
       ORDER BY lr.created_at DESC`,
      [user.userId],
    );
    return { success: true, data: requests };
  }

  @Get('requests/:id')
  @UseGuards(AuthGuard('jwt'))
  public async getRequest(@Param('id') id: string) {
    const [req] = await this.ds.query(
      `SELECT lr.*, u.full_name as customer_name, u.phone_number as customer_phone
       FROM laundry_requests lr
       LEFT JOIN users u ON lr.customer_id = u.id
       WHERE lr.id = $1`,
      [id],
    );
    if (!req) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
    const items = await this.ds.query(
      `SELECT * FROM laundry_request_items WHERE request_id = $1`,
      [id],
    );
    const responses = await this.ds.query(
      `SELECT r.*, u.full_name as washer_name
       FROM laundry_responses r LEFT JOIN users u ON r.washer_id = u.id
       WHERE r.request_id = $1 ORDER BY r.created_at`,
      [id],
    );
    return { success: true, data: { ...req, items, responses } };
  }

  @Post('requests/:id/respond')
  @UseGuards(AuthGuard('jwt'))
  public async respondToRequest(
    @Req() request: { user: AuthenticatedRequestUser },
    @Param('id') id: string,
    @Body() body: { proposedPrice: number; message?: string },
  ) {
    const { user } = request;
    const [existing] = await this.ds.query(
      `SELECT id FROM laundry_responses WHERE request_id = $1 AND washer_id = $2`,
      [id, user.userId],
    );
    if (existing) {
      return { success: false, error: { code: 'DUPLICATE', message: 'You already responded to this request' } };
    }
    const result = await this.ds.query(
      `INSERT INTO laundry_responses (request_id, washer_id, proposed_price, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, user.userId, body.proposedPrice, body.message || ''],
    );
    return { success: true, data: result[0] };
  }

  @Get('my-requests')
  @UseGuards(AuthGuard('jwt'))
  public async myRequests(@Req() request: { user: AuthenticatedRequestUser }) {
    const { user } = request;
    const items = await this.ds.query(
      `SELECT lr.*,
        (SELECT json_agg(json_build_object('id', r.id, 'washer_id', r.washer_id, 'proposed_price', r.proposed_price, 'message', r.message, 'status', r.status, 'washer_name', u.full_name)) 
         FROM laundry_responses r LEFT JOIN users u ON r.washer_id = u.id WHERE r.request_id = lr.id) as responses
       FROM laundry_requests lr
       WHERE lr.customer_id = $1
       ORDER BY lr.created_at DESC`,
      [user.userId],
    );
    return { success: true, data: items };
  }

  @Get('my-responses')
  @UseGuards(AuthGuard('jwt'))
  public async myResponses(@Req() request: { user: AuthenticatedRequestUser }) {
    const { user } = request;
    const items = await this.ds.query(
      `SELECT r.*, lr.description as request_description, lr.pickup_address, u.full_name as customer_name
       FROM laundry_responses r
       JOIN laundry_requests lr ON r.request_id = lr.id
       LEFT JOIN users u ON lr.customer_id = u.id
       WHERE r.washer_id = $1 ORDER BY r.created_at DESC`,
      [user.userId],
    );
    return { success: true, data: items };
  }
}
