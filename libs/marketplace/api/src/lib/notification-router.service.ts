import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

export interface NotificationRouteParams {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
  inApp?: boolean;
  push?: boolean;
  sms?: { phone: string; send: () => Promise<unknown> } | null;
}

/**
 * Routes a single notification across the available channels (in-app bell +
 * web push, and optionally SMS). Channel failures are isolated and logged so
 * one broken channel can never fail the caller's flow.
 */
@Injectable()
export class NotificationRouterService {
  private readonly logger = new Logger(NotificationRouterService.name);

  constructor(private readonly notifService: NotificationsService) {}

  public async route(params: NotificationRouteParams): Promise<void> {
    if (params.inApp !== false) {
      await this.safe('in_app', async () => {
        await this.notifService.create({
          tenantId: params.tenantId,
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          referenceId: params.referenceId,
          referenceType: params.referenceType,
          push: params.push !== false,
        });
      });
    }

    if (params.sms?.phone) {
      const phone = params.sms.phone;
      await this.safe('sms', async () => {
        await params.sms!.send();
      }, phone);
    }
  }

  private async safe(channel: string, fn: () => Promise<void>, target = ''): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error(`Notification channel "${channel}" failed${target ? ` for ${target}` : ''}: ${error}`);
    }
  }
}
