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

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/marketplace',
  path: '/api/socket.io',
})
@Injectable()
export class MarketplaceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  
  private readonly logger = new Logger(MarketplaceGateway.name);
  private readonly connectedClients = new Map<string, { userId?: string; tenantId?: string }>();

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, {});
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; tenantId: string },
  ): void {
    const info = this.connectedClients.get(client.id);
    if (info) {
      info.userId = data.userId;
      info.tenantId = data.tenantId;
    }
    client.join(`tenant:${data.tenantId}`);
    client.join(`user:${data.userId}`);
    client.emit('authenticated', { success: true });
  }

  @SubscribeMessage('track-order')
  handleTrackOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): void {
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

  public notifyVendorOrder(tenantId: string, vendorId: string, order: Record<string, unknown>): void {
    this.server?.to(`tenant:${tenantId}`).emit('new-order', { vendorId, ...order });
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

  public notifyDisputeCreated(tenantId: string, dispute: Record<string, unknown>): void {
    this.server?.to(`tenant:${tenantId}`).emit('dispute-created', dispute);
  }

  public notifyNewOrder(vendorId: string, order: Record<string, unknown>): void {
    this.server?.to(`user:${vendorId}`).emit('new-order', order);
  }
}
