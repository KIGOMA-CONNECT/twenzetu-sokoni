import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetadataEngineService } from './metadata-engine.service';
import {
  DefineFieldDto,
  DefineFormDto,
  DefinePermissionDto,
  GenerateFormDto,
} from './dto/metadata.dto';

@Controller('metadata')
@UseGuards(AuthGuard('jwt'))
export class MetadataController {
  constructor(private readonly metadataService: MetadataEngineService) {}

  // Fields

  @Post('fields')
  async defineField(
    @Body() dto: DefineFieldDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const field = await this.metadataService.defineField({
      ...dto,
      tenantId,
    });
    return { success: true, data: field };
  }

  @Get('fields/:entityType')
  async getFieldsByEntityType(
    @Param('entityType') entityType: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const fields = await this.metadataService.getFieldsByEntityType(entityType, tenantId);
    return { success: true, data: fields };
  }

  // Forms

  @Post('forms')
  async defineForm(
    @Body() dto: DefineFormDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const form = await this.metadataService.defineForm({
      ...dto,
      tenantId,
    });
    return { success: true, data: form };
  }

  @Get('forms/:entityType')
  async getFormsByEntityType(
    @Param('entityType') entityType: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const forms = await this.metadataService.getFormsByEntityType(entityType, tenantId);
    return { success: true, data: forms };
  }

  // Permissions

  @Post('permissions')
  async definePermission(
    @Body() dto: DefinePermissionDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const permission = await this.metadataService.definePermission({
      ...dto,
      tenantId,
    } as any);
    return { success: true, data: permission };
  }

  @Get('permissions/:entityType')
  async getPermissionsByEntityType(
    @Param('entityType') entityType: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const permissions = await this.metadataService.getPermissionsByEntityType(entityType, tenantId);
    return { success: true, data: permissions };
  }

  @Get('permissions/:entityType/check')
  async checkPermission(
    @Param('entityType') entityType: string,
    @Query('role') role: string,
    @Query('action') action: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const hasPermission = await this.metadataService.checkPermission(
      entityType,
      role,
      action as any,
      tenantId,
    );
    return { success: true, data: { hasPermission } };
  }

  // Dynamic UI Generation

  @Post('generate-form')
  async generateFormConfig(
    @Body() dto: GenerateFormDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const config = await this.metadataService.generateFormConfig(
      dto.entityType,
      dto.formName,
      tenantId,
    );
    return { success: true, data: config };
  }
}
