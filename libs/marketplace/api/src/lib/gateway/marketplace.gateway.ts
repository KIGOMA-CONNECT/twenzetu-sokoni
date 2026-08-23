import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { AppConfigService } from '@afri-market/core-config';
import { JwtPayload } from '@afri-market/identity-infrastructure';

interface ConnectedClient {
  userId?: string;
  tenantId?: string;
}

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((s) => s.trim()),
    credentials: true,
  },
  namespace: '/marketplace',
  path: '/api/socket.io',
})
@Injectable()
export class MarketplaceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MarketplaceGateway.name);
  private readonly connectedClients = new Map<string, ConnectedClient>();

  constructor(private readonly config: AppConfigService) {}

  private verifyClientToken(token?: string): ConnectedClient | null {
    if (!token || typeof token !== 'string') {
      return null;
    }
    try {
      const payload = verify(token, this.config.jwt.secret) as JwtPayload;
      if (!payload.sub || !payload.tenantId || payload.tokenType !== 'access') {
        return null;
      }
      return { userId: payload.sub, tenantId: payload.tenantId };
    } catch {
      return null;
    }
  }

  handleConnection(client: Socket): void {
    const token =
      typeof client.handshake.auth === 'object' && client.handshake.auth !== null
        ? (client.handshake.auth as { token?: string }).token
        : undefined;
    const identity = this.verifyClientToken(token);
    if (identity) {
      this.connectedClients.set(client.id, identity);
      client.join(`tenant:${identity.tenantId}`);
      client.join(`user:${identity.userId}`);
      client.emit('authenticated', { success: true });
    } else {
      this.connectedClients.set(client.id, {});
      this.logger.warn(`Unauthenticated WS connection rejected: ${client.id}`);
      client.emit('auth_required', { message: 'Valid JWT token required' });
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token?: string },
  ): void {
    const identity = this.verifyClientToken(data?.token);
    if (!identity) {
      client.emit('authenticated', { success: false, message: 'Invalid token' });
      return;
    }
    this.connectedClients.set(client.id, identity);
    client.join(`tenant:${identity.tenantId}`);
    client.join(`user:${identity.userId}`);
    client.emit('authenticated', { success: true });
  }

  @SubscribeMessage('track-order')
  handleTrackOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): void {
    const info = this.connectedClients.get(client.id);
    if (!info?.userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }
    if (!data.orderId || typeof data.orderId !== 'string' || data.orderId.length > 50) {
      client.emit('error', { message: 'Invalid order ID' });
      return;
    }
    client.join(`order:${data.orderId}`);
    client.emit('tracking', { orderId: data.orderId, tracking: true });
  }

  @SubscribeMessage('untrack-order')
  handleUntrackOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): void {
    client.leave(`order:${data.orderId}`);
    client.emit('untracked', { orderId: data.orderId });
  }

  public notifyOrderUpdate(orderId: string, update: Record<string, unknown>): void {
    this.server?.to(`order:${orderId}`).emit('order-update', { orderId, ...update });
  }

  public notifyDriverDelivery(tenantId: string, driverId: string, delivery: Record<string, unknown>): void {
    this.server?.to(`user:${driverId}`).emit('delivery-update', { tenantId, ...delivery });
  }

  public notifyUser(userId: string, event: string, data: Record<string, unknown>): void {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  public notifyPaymentConfirmed(userId: string, payment: Record<string, unknown>): void {
    this.server?.to(`user:${userId}`).emit('payment-confirmed', payment);
  }

  public notifyDeliveryStatusChanged(orderId: string, driverId: string, delivery: Record<string, unknown>): void {
    this.server?.to(`order:${orderId}`).emit('delivery-status-changed', delivery);
    this.server?.to(`user:${driverId}`).emit('delivery-update', delivery);
  }

  // Scoped to the two parties of the dispute instead of the whole tenant room,
  // which fanned out O(tenant users) messages per event.
  public notifyDisputeCreated(
    tenantId: string,
    dispute: Record<string, unknown>,
    participants: { customerId: string; vendorId: string },
  ): void {
    const payload = { tenantId, ...dispute };
    this.server?.to(`user:${participants.customerId}`).emit('dispute-created', payload);
    this.server?.to(`user:${participants.vendorId}`).emit('dispute-created', payload);
  }

  public notifyNewOrder(vendorId: string, order: Record<string, unknown>): void {
    this.server?.to(`user:${vendorId}`).emit('new-order', order);
  }
}
