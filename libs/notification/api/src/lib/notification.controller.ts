import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async sendNotification(
    @Body() body: {
      userId: string;
      channel: string;
      title: string;
      body: string;
      priority?: string;
      data?: Record<string, unknown>;
      templateId?: string;
      templateVariables?: Record<string, string>;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const notification = await this.notificationService.sendNotification(
      tenantId,
      body.userId,
      body.channel,
      body.title,
      body.body,
      body.priority,
      body.data,
      body.templateId,
      body.templateVariables,
    );
    return { success: true, data: notification };
  }

  @Get()
  async getNotifications(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Req() req?: any,
  ) {
    const tenantId = req.user.tenantId;
    const notifications = await this.notificationService.getNotifications(
      tenantId,
      userId,
      status,
      channel,
    );
    return { success: true, data: notifications };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const notification = await this.notificationService.markAsRead(id, tenantId);
    return { success: true, data: notification };
  }

  @Patch(':id/sent')
  async markAsSent(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const notification = await this.notificationService.markAsSent(id, tenantId);
    return { success: true, data: notification };
  }

  @Post('templates')
  async createTemplate(
    @Body() body: {
      name: string;
      channel: string;
      subject?: string;
      bodyTemplate: string;
      variables: string[];
      isActive?: boolean;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const template = await this.notificationService.createTemplate(
      tenantId,
      body.name,
      body.channel,
      body.subject ?? null,
      body.bodyTemplate,
      body.variables,
      body.isActive,
    );
    return { success: true, data: template };
  }

  @Get('templates')
  async getTemplates(
    @Query('channel') channel?: string,
    @Req() req?: any,
  ) {
    const tenantId = req.user.tenantId;
    const templates = await this.notificationService.getTemplates(tenantId, channel);
    return { success: true, data: templates };
  }

  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const template = await this.notificationService.getTemplateById(id, tenantId);
    return { success: true, data: template };
  }
}
