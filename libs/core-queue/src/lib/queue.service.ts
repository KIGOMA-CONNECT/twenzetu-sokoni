import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

export interface OrderJobData {
  orderId: string;
  tenantId: string;
  action: 'created' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payload: Record<string, unknown>;
}

export interface PaymentJobData {
  paymentId: string;
  orderId: string;
  tenantId: string;
  action: 'initiated' | 'confirmed' | 'failed' | 'refunded';
  payload: Record<string, unknown>;
}

export interface NotificationJobData {
  userId: string;
  tenantId: string;
  type: 'sms' | 'push' | 'email' | 'in_app';
  template: string;
  payload: Record<string, unknown>;
}

export interface AuditJobData {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('orders') private readonly ordersQueue: Queue,
    @InjectQueue('payments') private readonly paymentsQueue: Queue,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('audit') private readonly auditQueue: Queue,
  ) {}

  async addOrderJob(data: OrderJobData, opts?: { delay?: number; priority?: number }): Promise<Job<OrderJobData>> {
    const job = await this.ordersQueue.add('process-order', data, {
      delay: opts?.delay ?? 0,
      priority: opts?.priority ?? 0,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.debug(`Order job ${job.id} added for order ${data.orderId}`);
    return job;
  }

  async addPaymentJob(data: PaymentJobData, opts?: { delay?: number; priority?: number }): Promise<Job<PaymentJobData>> {
    const job = await this.paymentsQueue.add('process-payment', data, {
      delay: opts?.delay ?? 0,
      priority: opts?.priority ?? 0,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.debug(`Payment job ${job.id} added for payment ${data.paymentId}`);
    return job;
  }

  async addNotificationJob(data: NotificationJobData, opts?: { delay?: number }): Promise<Job<NotificationJobData>> {
    const job = await this.notificationsQueue.add('send-notification', data, {
      delay: opts?.delay ?? 0,
      attempts: 3,
      backoff: { type: 'exponential', delay: 500 },
    });
    this.logger.debug(`Notification job ${job.id} added for user ${data.userId}`);
    return job;
  }

  async addAuditJob(data: AuditJobData): Promise<Job<AuditJobData>> {
    const job = await this.auditQueue.add('write-audit', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.debug(`Audit job ${job.id} added: ${data.action} on ${data.entity}`);
    return job;
  }

  async getQueueStats(): Promise<Record<string, { waiting: number; active: number; completed: number; failed: number }>> {
    const queues = [this.ordersQueue, this.paymentsQueue, this.notificationsQueue, this.auditQueue];
    const stats: Record<string, { waiting: number; active: number; completed: number; failed: number }> = {};

    for (const queue of queues) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      stats[queue.name] = { waiting, active, completed, failed };
    }

    return stats;
  }
}
