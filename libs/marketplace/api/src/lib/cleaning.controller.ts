import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedRequestUser } from '@abms/identity-infrastructure';

@Controller('cleaning')
export class CleaningController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get('categories')
  public async listCategories() {
    const cats = await this.ds.query(
      `SELECT id, name, description, base_price, price_per_sqm, estimated_hours, currency
       FROM cleaning_categories WHERE is_active = true ORDER BY name`
    );
    return { success: true, data: cats };
  }

  @Post('requests')
  @UseGuards(AuthGuard('jwt'))
  public async createRequest(
    @Req() request: { user: AuthenticatedRequestUser },
    @Body() body: {
      categoryId?: string;
      description?: string;
      propertySizeSqm?: number;
      address?: string;
      preferredDate?: string;
      preferredTime?: string;
      photoUrls?: string[];
    },
  ) {
    const { user } = request;
    const result = await this.ds.query(
      `INSERT INTO cleaning_requests (tenant_id, customer_id, category_id, description, property_size_sqm, address, preferred_date, preferred_time, photo_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user.tenantId, user.userId, body.categoryId || null, body.description || '', body.propertySizeSqm || null, body.address || '', body.preferredDate || null, body.preferredTime || null, body.photoUrls || []],
    );
    return { success: true, data: result[0] };
  }

  @Get('requests')
  @UseGuards(AuthGuard('jwt'))
  public async listRequests(@Req() request: { user: AuthenticatedRequestUser }) {
    const { user } = request;
    const requests = await this.ds.query(
      `SELECT cr.*, cc.name as category_name, u.full_name as customer_name
       FROM cleaning_requests cr
       LEFT JOIN cleaning_categories cc ON cr.category_id = cc.id
       LEFT JOIN users u ON cr.customer_id = u.id
       WHERE cr.status = 'OPEN' AND cr.customer_id != $1
       ORDER BY cr.created_at DESC`,
      [user.userId],
    );
    return { success: true, data: requests };
  }

  @Get('requests/:id')
  @UseGuards(AuthGuard('jwt'))
  public async getRequest(@Param('id') id: string) {
    const [req] = await this.ds.query(
      `SELECT cr.*, cc.name as category_name, u.full_name as customer_name, u.phone_number as customer_phone
       FROM cleaning_requests cr
       LEFT JOIN cleaning_categories cc ON cr.category_id = cc.id
       LEFT JOIN users u ON cr.customer_id = u.id
       WHERE cr.id = $1`,
      [id],
    );
    if (!req) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
    const responses = await this.ds.query(
      `SELECT r.*, u.full_name as cleaner_name
       FROM cleaning_responses r LEFT JOIN users u ON r.cleaner_id = u.id
       WHERE r.request_id = $1 ORDER BY r.created_at`,
      [id],
    );
    return { success: true, data: { ...req, responses } };
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
      `SELECT id FROM cleaning_responses WHERE request_id = $1 AND cleaner_id = $2`,
      [id, user.userId],
    );
    if (existing) {
      return { success: false, error: { code: 'DUPLICATE', message: 'You already responded to this request' } };
    }
    const result = await this.ds.query(
      `INSERT INTO cleaning_responses (request_id, cleaner_id, proposed_price, message)
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
      `SELECT cr.*, cc.name as category_name,
        (SELECT json_agg(json_build_object('id', r.id, 'cleaner_id', r.cleaner_id, 'proposed_price', r.proposed_price, 'message', r.message, 'status', r.status, 'cleaner_name', u.full_name)) 
         FROM cleaning_responses r LEFT JOIN users u ON r.cleaner_id = u.id WHERE r.request_id = cr.id) as responses
       FROM cleaning_requests cr
       LEFT JOIN cleaning_categories cc ON cr.category_id = cc.id
       WHERE cr.customer_id = $1
       ORDER BY cr.created_at DESC`,
      [user.userId],
    );
    return { success: true, data: items };
  }

  @Get('my-responses')
  @UseGuards(AuthGuard('jwt'))
  public async myResponses(@Req() request: { user: AuthenticatedRequestUser }) {
    const { user } = request;
    const items = await this.ds.query(
      `SELECT r.*, cr.description as request_description, cr.address, u.full_name as customer_name
       FROM cleaning_responses r
       JOIN cleaning_requests cr ON r.request_id = cr.id
       LEFT JOIN users u ON cr.customer_id = u.id
       WHERE r.cleaner_id = $1 ORDER BY r.created_at DESC`,
      [user.userId],
    );
    return { success: true, data: items };
  }
}
