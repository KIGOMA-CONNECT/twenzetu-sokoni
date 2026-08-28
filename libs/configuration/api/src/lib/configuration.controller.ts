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
import { ConfigurationService } from './configuration.service';
import {
  SetSystemConfigDto,
  SetTenantConfigDto,
  SetFeatureFlagDto,
} from './dto/configuration.dto';

@Controller('config')
@UseGuards(AuthGuard('jwt'))
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}

  // ── System Config ──

  @Get('system')
  async getSystemConfigs(@Query('category') category?: string) {
    const configs = await this.configService.getSystemConfigs(category);
    return { success: true, data: configs };
  }

  @Get('system/:key')
  async getSystemConfig(@Param('key') key: string) {
    const config = await this.configService.getSystemConfig(key);
    return { success: true, data: config };
  }

  @Post('system')
  async setSystemConfig(@Body() dto: SetSystemConfigDto) {
    const config = await this.configService.setSystemConfig(
      dto.key,
      dto.value,
      dto.valueType,
      dto.description,
      dto.category,
    );
    return { success: true, data: config };
  }

  // ── Tenant Config ──

  @Get('tenant/:tenantId')
  async getTenantConfigs(
    @Param('tenantId') tenantId: string,
    @Query('category') category?: string,
  ) {
    const configs = await this.configService.getTenantConfigs(tenantId, category);
    return { success: true, data: configs };
  }

  @Get('tenant/:tenantId/:key')
  async getTenantConfig(
    @Param('tenantId') tenantId: string,
    @Param('key') key: string,
  ) {
    const config = await this.configService.getTenantConfig(tenantId, key);
    return { success: true, data: config };
  }

  @Post('tenant/:tenantId')
  async setTenantConfig(
    @Param('tenantId') tenantId: string,
    @Body() dto: SetTenantConfigDto,
  ) {
    const config = await this.configService.setTenantConfig(
      tenantId,
      dto.key,
      dto.value,
      dto.valueType,
      dto.description,
      dto.category,
    );
    return { success: true, data: config };
  }

  // ── Feature Flags ──

  @Get('feature-flags')
  async getFeatureFlags() {
    const flags = await this.configService.getFeatureFlags();
    return { success: true, data: flags };
  }

  @Get('feature-flags/:key')
  async getFeatureFlag(
    @Param('key') key: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;
    const result = await this.configService.getFeatureFlag(key, tenantId, userRole);
    return { success: true, data: result };
  }

  @Post('feature-flags')
  async setFeatureFlag(@Body() dto: SetFeatureFlagDto) {
    const flag = await this.configService.setFeatureFlag(
      dto.key,
      dto.name,
      dto.state,
      dto.percentage,
      dto.allowedTenantIds,
      dto.allowedRoles,
      dto.description,
    );
    return { success: true, data: flag };
  }
}
