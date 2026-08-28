import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationOrmEntity,
  NotificationTemplateOrmEntity,
} from '@abms/notification-infrastructure';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly notificationRepo: Repository<NotificationOrmEntity>,
    @InjectRepository(NotificationTemplateOrmEntity)
    private readonly templateRepo: Repository<NotificationTemplateOrmEntity>,
  ) {}

  async sendNotification(tenantId: string, userId: string, channel: string, title: string, body: string, priority?: string, data?: Record<string, unknown>, templateId?: string, templateVariables?: Record<string, string>): Promise<NotificationOrmEntity> {
    const entity = this.notificationRepo.create({
      userId,
      channel,
      title,
      body,
      priority: priority ?? 'NORMAL',
      status: 'PENDING',
      data: data ?? {},
      templateId: templateId ?? null,
      templateVariables: templateVariables ?? {},
      tenantId,
    });

    return this.notificationRepo.save(entity);
  }

  async getNotifications(tenantId: string, userId?: string, status?: string, channel?: string): Promise<NotificationOrmEntity[]> {
    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (channel) where.channel = channel;

    return this.notificationRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async markAsRead(notificationId: string, tenantId: string): Promise<NotificationOrmEntity> {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId, tenantId } });
    if (!notification) throw new NotFoundException('Notification not found');

    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAsSent(notificationId: string, tenantId: string): Promise<NotificationOrmEntity> {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId, tenantId } });
    if (!notification) throw new NotFoundException('Notification not found');

    notification.sentAt = new Date();
    notification.status = 'SENT';
    return this.notificationRepo.save(notification);
  }

  async createTemplate(tenantId: string, name: string, channel: string, subject: string | null, bodyTemplate: string, variables: string[], isActive?: boolean): Promise<NotificationTemplateOrmEntity> {
    const entity = this.templateRepo.create({
      name,
      channel,
      subject: subject ?? null,
      bodyTemplate,
      variables,
      isActive: isActive ?? true,
      tenantId,
    });

    return this.templateRepo.save(entity);
  }

  async getTemplates(tenantId: string, channel?: string): Promise<NotificationTemplateOrmEntity[]> {
    const where: Record<string, unknown> = { tenantId };
    if (channel) where.channel = channel;

    return this.templateRepo.find({ where });
  }

  async getTemplateById(id: string, tenantId: string): Promise<NotificationTemplateOrmEntity> {
    const template = await this.templateRepo.findOne({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }
}
