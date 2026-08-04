import { Controller, Get, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { ParseFlexibleUuidPipe } from './common/parse-flexible-uuid.pipe';

@ApiTags('Recommendations')
@Controller()
export class RecommendationsController {
  constructor(
    @Inject(EntityManager) private readonly entityManager: EntityManager,
  ) {}

  @Get('search/suggestions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Autocomplete search suggestions' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async searchSuggestions(
    @CurrentUser() user: JwtPayload,
    @Query('q') q: string,
    @Query('limit') limit?: number,
  ) {
    if (!q || q.length < 2) return { data: [] };
    const result = await this.entityManager.query(
      `SELECT id, name, price, currency, image_url, vendor_id
       FROM products
       WHERE tenant_id = $1 AND status = 'ACTIVE' AND name ILIKE $2
       ORDER BY
         CASE WHEN name ILIKE $3 THEN 0 ELSE 1 END,
         name ASC
       LIMIT $4`,
      [user.tenantId, `%${q}%`, `${q}%`, limit ?? 8],
    );
    return { data: result };
  }

  @Get('recommendations/trending')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trending products based on recent order volume' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async findTrending(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ) {
    const result = await this.entityManager.query(
      `SELECT p.id, p.name, p.description, p.price, p.currency, p.type, p.stock_quantity, p.unit, p.status, p.image_url, p.vendor_id, p.created_at,
              COALESCE(oi.order_count, 0) AS order_count
       FROM products p
       LEFT JOIN (
         SELECT oi2.product_id, COUNT(*) AS order_count
         FROM order_items oi2
         JOIN orders o ON o.id = oi2.order_id
         WHERE o.tenant_id = $1 AND o.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY oi2.product_id
       ) oi ON oi.product_id = p.id
       WHERE p.tenant_id = $1 AND p.status = 'ACTIVE'
       ORDER BY order_count DESC, p.created_at DESC
       LIMIT $2`,
      [user.tenantId, limit ?? 10],
    );
    return { data: result };
  }

  @Get('search/advanced')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Advanced product search' })
  @ApiQuery({ name: 'q', required: false, description: 'Free text search' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price_asc', 'price_desc', 'newest', 'popular'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  public async advancedSearch(
    @CurrentUser() user: JwtPayload,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('vendorId') vendorId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const conditions: string[] = ['p.tenant_id = $1', "p.status = 'ACTIVE'"];
    const params: Array<string | number> = [user.tenantId];
    let paramIdx = 2;

    if (q && q.length >= 2) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
      params.push(`%${q}%`);
      paramIdx++;
    }
    if (categoryId) {
      conditions.push(`p.category_id = $${paramIdx}`);
      params.push(categoryId);
      paramIdx++;
    }
    if (minPrice !== undefined) {
      conditions.push(`p.price >= $${paramIdx}`);
      params.push(minPrice);
      paramIdx++;
    }
    if (maxPrice !== undefined) {
      conditions.push(`p.price <= $${paramIdx}`);
      params.push(maxPrice);
      paramIdx++;
    }
    if (vendorId) {
      conditions.push(`p.vendor_id = $${paramIdx}`);
      params.push(vendorId);
      paramIdx++;
    }

    let orderBy = 'p.created_at DESC';
    if (sortBy === 'price_asc') orderBy = 'p.price ASC';
    else if (sortBy === 'price_desc') orderBy = 'p.price DESC';
    else if (sortBy === 'newest') orderBy = 'p.created_at DESC';
    else if (sortBy === 'popular') orderBy = 'order_count DESC, p.created_at DESC';

    const countQuery = `SELECT COUNT(*) FROM products p WHERE ${conditions.join(' AND ')}`;
    const countResult = await this.entityManager.query(countQuery, params);
    const total = parseInt(countResult[0]?.count || '0', 10);

    const l = limit ?? 20;
    const o = offset ?? 0;

    const selectQuery = `SELECT p.id, p.name, p.description, p.price, p.currency, p.type, p.stock_quantity, p.unit, p.status, p.image_url, p.vendor_id, p.created_at,
       COALESCE((SELECT COUNT(*) FROM order_items oi3 JOIN orders o3 ON o3.id = oi3.order_id WHERE oi3.product_id = p.id AND o3.tenant_id = $1), 0) AS order_count
       FROM products p WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(l, o);

    const result = await this.entityManager.query(selectQuery, params);
    return { data: { data: result, total, limit: l, offset: o } };
  }

  @Get('products/:id/similar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get similar products by category' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async findSimilar(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseFlexibleUuidPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.entityManager.query(
      `SELECT p.id, p.name, p.description, p.price, p.currency, p.type, p.stock_quantity, p.unit, p.status, p.image_url, p.vendor_id, p.created_at
       FROM products p
       WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1 AND tenant_id = $2)
         AND p.id != $1
         AND p.tenant_id = $2
         AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC
       LIMIT $3`,
      [id, user.tenantId, limit ?? 10],
    );
    return { data: result };
  }

  @Get('recommendations/featured')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get featured/popular products across marketplace' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async findFeatured(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ) {
    const result = await this.entityManager.query(
      `SELECT p.id, p.name, p.description, p.price, p.currency, p.type, p.stock_quantity, p.unit, p.status, p.image_url, p.vendor_id, p.created_at,
              COALESCE(oi.order_count, 0) AS order_count
       FROM products p
       LEFT JOIN (
         SELECT product_id, COUNT(*) AS order_count
         FROM order_items
         WHERE tenant_id = $1
         GROUP BY product_id
       ) oi ON oi.product_id = p.id
       WHERE p.tenant_id = $1 AND p.status = 'ACTIVE'
       ORDER BY order_count DESC, p.created_at DESC
       LIMIT $2`,
      [user.tenantId, limit ?? 10],
    );
    return { data: result };
  }

  @Get('recommendations/for-you')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Personalized recommendations based on order history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async findForYou(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ) {
    const result = await this.entityManager.query(
      `SELECT p.id, p.name, p.description, p.price, p.currency, p.type, p.stock_quantity, p.unit, p.status, p.image_url, p.vendor_id, p.created_at
       FROM products p
       WHERE p.category_id IN (
         SELECT DISTINCT pr.category_id
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products pr ON pr.id = oi.product_id
         WHERE o.customer_id = $1 AND o.tenant_id = $2
       )
         AND p.tenant_id = $2
         AND p.status = 'ACTIVE'
         AND p.id NOT IN (
           SELECT pr2.id
           FROM orders o2
           JOIN order_items oi2 ON oi2.order_id = o2.id
           JOIN products pr2 ON pr2.id = oi2.product_id
           WHERE o2.customer_id = $1 AND o2.tenant_id = $2
         )
       ORDER BY p.created_at DESC
       LIMIT $3`,
      [user.sub, user.tenantId, limit ?? 10],
    );
    return { data: result };
  }
}
