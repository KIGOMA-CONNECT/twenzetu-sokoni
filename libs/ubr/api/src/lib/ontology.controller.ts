import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OntologyService } from './ontology.service';
import {
  RegisterEntityDto,
  UpdateEntityDto,
  DefineRelationshipDto,
  SearchEntityDto,
} from './dto/ontology.dto';

@Controller('ontology')
@UseGuards(AuthGuard('jwt'))
export class OntologyController {
  constructor(private readonly ontologyService: OntologyService) {}

  @Post('entities')
  async registerEntity(
    @Body() dto: RegisterEntityDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const entity = await this.ontologyService.registerEntity({
      ...dto,
      tenantId,
    });
    return { success: true, data: entity };
  }

  @Get('entities')
  async getAllEntities(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const entities = await this.ontologyService.getAllEntities(tenantId);
    return { success: true, data: entities };
  }

  @Get('entities/search')
  async searchEntities(
    @Query() query: SearchEntityDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const entities = await this.ontologyService.searchEntities(query.query, tenantId);
    return { success: true, data: entities };
  }

  @Get('entities/type/:entityType')
  async getEntitiesByType(
    @Param('entityType') entityType: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const entities = await this.ontologyService.getEntitiesByType(entityType, tenantId);
    return { success: true, data: entities };
  }

  @Get('entities/category/:category')
  async getEntitiesByCategory(
    @Param('category') category: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const entities = await this.ontologyService.getEntitiesByCategory(category as any, tenantId);
    return { success: true, data: entities };
  }

  @Get('entities/:id')
  async getEntity(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const entity = await this.ontologyService.getEntity(id, tenantId);
    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }
    return { success: true, data: entity };
  }

  @Patch('entities/:id')
  async updateEntity(
    @Param('id') id: string,
    @Body() dto: UpdateEntityDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const entity = await this.ontologyService.updateEntity(id, tenantId, dto);
    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }
    return { success: true, data: entity };
  }

  @Delete('entities/:id')
  async deleteEntity(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.ontologyService.deleteEntity(id, tenantId);
    return { success: result };
  }

  // Relationships

  @Post('relationships')
  async defineRelationship(@Body() dto: DefineRelationshipDto) {
    const relationship = await this.ontologyService.defineRelationship(dto);
    return { success: true, data: relationship };
  }

  @Get('relationships')
  async getAllRelationships() {
    const relationships = await this.ontologyService.getAllRelationships();
    return { success: true, data: relationships };
  }

  @Get('relationships/type/:entityType')
  async getRelationshipsByType(@Param('entityType') entityType: string) {
    const relationships = await this.ontologyService.getRelationshipsByEntityType(entityType);
    return { success: true, data: relationships };
  }

  // Ontology queries

  @Get('hierarchy/:entityType')
  async getEntityTypeHierarchy(@Param('entityType') entityType: string) {
    const hierarchy = await this.ontologyService.getEntityTypeHierarchy(entityType);
    return { success: true, data: hierarchy };
  }

  @Get('counts')
  async getCountsByType(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const counts = await this.ontologyService.countEntitiesByType(tenantId);
    return { success: true, data: counts };
  }
}
