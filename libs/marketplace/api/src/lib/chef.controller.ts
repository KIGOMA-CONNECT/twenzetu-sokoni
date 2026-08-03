import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedRequestUser } from '@abms/identity-infrastructure';

@Controller('chef')
export class ChefController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get('meals')
  public async listMeals() {
    const meals = await this.ds.query(
      `SELECT id, name, description, base_price, currency, estimated_prep_time
       FROM chef_meal_categories WHERE is_active = true ORDER BY name`
    );
    return { success: true, data: meals };
  }

  @Post('requests')
  @UseGuards(AuthGuard('jwt'))
  public async createRequest(
    @Req() request: { user: AuthenticatedRequestUser },
    @Body() body: {
      mealCategoryId?: string;
      description?: string;
      servings?: number;
      preferredDate?: string;
      preferredTime?: string;
      deliveryAddress?: string;
      budgetMin?: number;
      budgetMax?: number;
    },
  ) {
    const { user } = request;
    const result = await this.ds.query(
      `INSERT INTO chef_requests (tenant_id, customer_id, meal_category_id, description, servings, preferred_date, preferred_time, delivery_address, budget_min, budget_max)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [user.tenantId, user.userId, body.mealCategoryId || null, body.description || '', body.servings || 1, body.preferredDate || null, body.preferredTime || null, body.deliveryAddress || '', body.budgetMin || null, body.budgetMax || null],
    );
    return { success: true, data: result[0] };
  }

  @Get('requests')
  @UseGuards(AuthGuard('jwt'))
  public async listRequests(@Req() request: { user: AuthenticatedRequestUser }) {
    const { user } = request;
    const requests = await this.ds.query(
      `SELECT cr.*, cmc.name as meal_name, u.full_name as customer_name
       FROM chef_requests cr
       LEFT JOIN chef_meal_categories cmc ON cr.meal_category_id = cmc.id
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
      `SELECT cr.*, cmc.name as meal_name, u.full_name as customer_name, u.phone_number as customer_phone
       FROM chef_requests cr
       LEFT JOIN chef_meal_categories cmc ON cr.meal_category_id = cmc.id
       LEFT JOIN users u ON cr.customer_id = u.id
       WHERE cr.id = $1`,
      [id],
    );
    if (!req) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
    const responses = await this.ds.query(
      `SELECT r.*, u.full_name as chef_name
       FROM chef_responses r LEFT JOIN users u ON r.chef_id = u.id
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
      `SELECT id FROM chef_responses WHERE request_id = $1 AND chef_id = $2`,
      [id, user.userId],
    );
    if (existing) {
      return { success: false, error: { code: 'DUPLICATE', message: 'You already responded to this request' } };
    }
    const result = await this.ds.query(
      `INSERT INTO chef_responses (request_id, chef_id, proposed_price, message)
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
      `SELECT cr.*, cmc.name as meal_name,
        (SELECT json_agg(json_build_object('id', r.id, 'chef_id', r.chef_id, 'proposed_price', r.proposed_price, 'message', r.message, 'status', r.status, 'chef_name', u.full_name)) 
         FROM chef_responses r LEFT JOIN users u ON r.chef_id = u.id WHERE r.request_id = cr.id) as responses
       FROM chef_requests cr
       LEFT JOIN chef_meal_categories cmc ON cr.meal_category_id = cmc.id
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
      `SELECT r.*, cr.description as request_description, cr.delivery_address, u.full_name as customer_name
       FROM chef_responses r
       JOIN chef_requests cr ON r.request_id = cr.id
       LEFT JOIN users u ON cr.customer_id = u.id
       WHERE r.chef_id = $1 ORDER BY r.created_at DESC`,
      [user.userId],
    );
    return { success: true, data: items };
  }
}
