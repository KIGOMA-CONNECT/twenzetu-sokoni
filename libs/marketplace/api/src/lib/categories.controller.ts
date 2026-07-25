import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategoryUseCase, ListCategoriesUseCase } from '@afri-market/marketplace-application';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly createCategory: CreateCategoryUseCase,
    private readonly listCategories: ListCategoriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active categories for a tenant' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findAll(@CurrentUser() user: JwtPayload) {
    const data = await this.listCategories.execute(user.tenantId);
    return { data };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    return this.createCategory.execute(user.tenantId, dto);
  }
}
