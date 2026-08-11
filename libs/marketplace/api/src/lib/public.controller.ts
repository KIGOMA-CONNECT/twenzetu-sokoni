import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { ListActiveAdsUseCase, ListCategoriesUseCase } from '@afri-market/marketplace-application';

const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000002';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly listActiveAds: ListActiveAdsUseCase,
    private readonly listCategories: ListCategoriesUseCase,
  ) {}

  @Get('ads')
  @ApiOperation({ summary: 'Public list of active marketing adverts' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiResponse({ status: 200, description: 'Active adverts' })
  public async ads(@Req() req: Request) {
    const tenantId = this.resolveTenant(req);
    const ads = await this.listActiveAds.execute(tenantId);
    return { data: ads.map((a) => a.toDto()) };
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Public catalog of active categories with marketing data' })
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Defaults to the primary tenant' })
  @ApiResponse({ status: 200, description: 'Active categories' })
  public async catalog(@Req() req: Request) {
    const tenantId = this.resolveTenant(req);
    const categories = await this.listCategories.execute(tenantId);
    return { data: categories.map((c) => c.toDto()) };
  }

  private resolveTenant(req: Request): string {
    const header = req.headers['x-tenant-id'];
    if (typeof header === 'string' && header.trim().length > 0) {
      return header.trim();
    }
    return DEFAULT_TENANT_ID;
  }
}
