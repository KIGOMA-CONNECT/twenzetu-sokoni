import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { SavePushSubscriptionDto } from './dto/save-push-subscription.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async list(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notifService.findByUser(user.sub, Number(limit) || 50, Number(offset) || 0);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async unreadCount(@CurrentUser() user: JwtPayload) {
    const count = await this.notifService.countUnread(user.sub);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  public async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.notifService.markAsRead(id, user.sub);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All marked as read' })
  public async markAllRead(@CurrentUser() user: JwtPayload) {
    await this.notifService.markAllAsRead(user.sub);
    return { success: true };
  }

  @Get('push/vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscriptions' })
  @ApiResponse({ status: 200, description: 'Public key' })
  public async vapidPublicKey() {
    return { publicKey: this.pushService.publicKey };
  }

  @Post('push-subscriptions')
  @ApiOperation({ summary: 'Save a web push subscription for the current user' })
  @ApiResponse({ status: 201, description: 'Subscription saved' })
  public async saveSubscription(
    @Body() dto: SavePushSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.pushService.saveSubscription(user.sub, user.tenantId, dto);
    return { success: true };
  }

  @Delete('push-subscriptions')
  @ApiOperation({ summary: 'Remove a web push subscription for the current user' })
  @ApiResponse({ status: 200, description: 'Subscription removed' })
  public async removeSubscription(
    @Query('endpoint') endpoint: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (endpoint) {
      await this.pushService.removeSubscription(user.sub, endpoint);
    }
    return { success: true };
  }
}
