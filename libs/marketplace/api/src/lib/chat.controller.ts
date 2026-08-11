import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { MarketplaceGateway } from './gateway';
import { FindOrdersUseCase, VendorAccessService } from '@afri-market/marketplace-application';

import { IsString, IsNotEmpty } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}

@ApiTags('Chat')
@Controller('messages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly gateway: MarketplaceGateway,
    private readonly findOrders: FindOrdersUseCase,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  private async assertParticipant(orderId: string, user: JwtPayload): Promise<void> {
    const order = await this.findOrders.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      return;
    }
    if (user.role === 'vendor') {
      const ctx = await this.vendorAccess.resolve(user);
      if (ctx && ctx.vendorId === order.vendorId.value) {
        return;
      }
    }
    if (user.role === 'driver' && order.driverId && order.driverId.value === user.sub) {
      return;
    }
    if (order.customerId.value === user.sub) {
      return;
    }
    throw new NotFoundException('Order not found');
  }

  @Post()
  @ApiOperation({ summary: 'Send a chat message for an order' })
  @ApiBody({ schema: { properties: { orderId: { type: 'string' }, message: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(@CurrentUser() user: JwtPayload, @Body() body: SendMessageDto) {
    await this.assertParticipant(body.orderId, user);
    const result = await this.ds.query(
      `INSERT INTO order_messages (tenant_id, order_id, sender_id, sender_name, sender_role, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [user.tenantId, body.orderId, user.sub, user.phoneNumber || 'User', user.role || 'customer', body.message],
    );

    const saved = result[0];
    const payload = {
      id: saved.id,
      orderId: body.orderId,
      senderId: user.sub,
      senderName: user.phoneNumber || 'User',
      senderRole: user.role || 'customer',
      message: body.message,
      createdAt: saved.created_at,
    };

    this.gateway.notifyOrderUpdate(body.orderId, { type: 'chat-message', ...payload });

    return payload;
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get chat messages for an order' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(@Param('orderId', ParseUUIDPipe) orderId: string, @CurrentUser() user: JwtPayload) {
    await this.assertParticipant(orderId, user);
    const rows = await this.ds.query(
      `SELECT id, sender_id, sender_name, sender_role, message, created_at
       FROM order_messages WHERE tenant_id = $1 AND order_id = $2 ORDER BY created_at ASC`,
      [user.tenantId, orderId],
    );
    return { data: rows };
  }
}
