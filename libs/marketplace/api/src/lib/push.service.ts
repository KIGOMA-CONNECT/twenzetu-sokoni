import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { AppConfigService } from '@afri-market/core-config';
import { PushSubscriptionOrmEntity } from '@afri-market/marketplace-infrastructure';
import { httpRequest } from '@afri-market/integrations';

export interface PushSubscriptionInput {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: { p256dh?: string; auth?: string };
  fcmToken?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Push delivery: Web Push (VAPID) for browsers and Firebase Cloud Messaging
 * (legacy HTTP API) for native tokens. Never throws: push failures must not
 * break the caller's flow.
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

  public get fcmEnabled(): boolean {
    return Boolean(this.config.fcm.serverKey);
  }

  public async saveSubscription(
    userId: string,
    tenantId: string,
    sub: PushSubscriptionInput,
  ): Promise<PushSubscriptionOrmEntity> {
    if (sub.fcmToken) {
      return this.saveFcmToken(userId, tenantId, sub.fcmToken);
    }
    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return this.subRepo.create({ userId, tenantId });
    }
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

  public async saveFcmToken(
    userId: string,
    tenantId: string,
    fcmToken: string,
  ): Promise<PushSubscriptionOrmEntity> {
    const existing = await this.subRepo.findOne({
      where: { userId, fcmToken },
    });
    if (existing) {
      return this.subRepo.save(existing);
    }
    const entity = this.subRepo.create({
      userId,
      tenantId,
      fcmToken,
    });
    return this.subRepo.save(entity);
  }

  public async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await this.subRepo.delete({ userId, endpoint });
  }

  public async removeFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.subRepo.delete({ userId, fcmToken });
  }

  public async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const subs = await this.subRepo.find({ where: { userId } });
    if (subs.length === 0) {
      return;
    }

    const webSubs = subs.filter((sub) => sub.endpoint && sub.p256dh && sub.auth);
    const fcmSubs = subs.filter((sub) => sub.fcmToken);

    const tasks: Promise<void>[] = [];
    if (webSubs.length > 0 && this.enabled) {
      tasks.push(this.sendWebPush(webSubs, payload));
    }
    if (fcmSubs.length > 0 && this.fcmEnabled) {
      tasks.push(this.sendFcm(fcmSubs, payload));
    }
    await Promise.allSettled(tasks);
  }

  private async sendWebPush(
    subs: PushSubscriptionOrmEntity[],
    payload: PushPayload,
  ): Promise<void> {
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
            endpoint: sub.endpoint as string,
            keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
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

  private async sendFcm(
    subs: PushSubscriptionOrmEntity[],
    payload: PushPayload,
  ): Promise<void> {
    const url = 'https://fcm.googleapis.com/fcm/send';
    const body = {
      notification: {
        title: payload.title,
        body: payload.body,
        click_action: payload.url ?? '/',
        icon: '/icons/icon-192.png',
        sound: 'default',
      },
      data: { url: payload.url ?? '/' },
    };
    const results = await Promise.allSettled(
      subs.map(() =>
        httpRequest<unknown>({
          method: 'POST',
          url,
          body,
          headers: {
            'Authorization': `key=${this.config.fcm.serverKey}`,
            'Content-Type': 'application/json',
          },
          timeoutMs: 10000,
        }),
      ),
    );
    results.forEach((result, index) => {
      const sub = subs[index];
      if (result.status === 'fulfilled') {
        return;
      }
      const reason = (result as PromiseRejectedResult).reason as { statusCode?: number };
      this.logger.warn(`FCM send failed for token ${sub.fcmToken?.slice(0, 12)}…: ${reason?.statusCode ?? 'unknown error'}`);
    });
  }
}
