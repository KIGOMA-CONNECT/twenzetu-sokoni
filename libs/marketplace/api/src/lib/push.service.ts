import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { AppConfigService } from '@afri-market/core-config';
import { PushSubscriptionOrmEntity } from '@afri-market/marketplace-infrastructure';

export interface PushSubscriptionInput {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Web Push (VAPID) subscriptions and delivery.
 * Never throws: push failures must not break the caller's flow.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushSubscriptionOrmEntity)
    private readonly subRepo: Repository<PushSubscriptionOrmEntity>,
    private readonly config: AppConfigService,
  ) {
    if (this.config.push.publicKey && this.config.push.privateKey) {
      webpush.setVapidDetails(
        this.config.push.subject,
        this.config.push.publicKey,
        this.config.push.privateKey,
      );
    } else {
      this.logger.warn('VAPID keys not configured; web push disabled');
    }
  }

  public get publicKey(): string {
    return this.config.push.publicKey;
  }

  public get enabled(): boolean {
    return Boolean(this.config.push.publicKey && this.config.push.privateKey);
  }

  public async saveSubscription(
    userId: string,
    tenantId: string,
    sub: PushSubscriptionInput,
  ): Promise<PushSubscriptionOrmEntity> {
    const existing = await this.subRepo.findOne({
      where: { userId, endpoint: sub.endpoint },
    });
    if (existing) {
      existing.p256dh = sub.keys.p256dh;
      existing.auth = sub.keys.auth;
      return this.subRepo.save(existing);
    }
    const entity = this.subRepo.create({
      userId,
      tenantId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    });
    return this.subRepo.save(entity);
  }

  public async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await this.subRepo.delete({ userId, endpoint });
  }

  public async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const subs = await this.subRepo.find({ where: { userId } });
    if (subs.length === 0) {
      return;
    }
    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message,
        ),
      ),
    );
    results.forEach((result, index) => {
      const sub = subs[index];
      if (result.status === 'fulfilled') {
        return;
      }
      const reason = (result as PromiseRejectedResult).reason as { statusCode?: number };
      if (reason && (reason.statusCode === 404 || reason.statusCode === 410)) {
        this.logger.warn(`Removing stale push subscription for ${sub.endpoint}`);
        this.subRepo.delete({ id: sub.id }).catch(() => {});
      } else {
        this.logger.warn(`Push send failed for ${sub.endpoint}: ${reason?.statusCode ?? 'unknown error'}`);
      }
    });
  }
}
