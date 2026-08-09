import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationOrmEntity } from '@afri-market/marketplace-infrastructure';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly notifRepo: Repository<NotificationOrmEntity>,
    private readonly pushService: PushService,
  ) {}

  public async create(params: {
    tenantId: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    referenceId?: string;
    referenceType?: string;
    push?: boolean;
  }): Promise<NotificationOrmEntity> {
    const entity = this.notifRepo.create({
      tenantId: params.tenantId,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      referenceId: params.referenceId ?? null,
      referenceType: params.referenceType ?? null,
      isRead: false,
    });
    const saved = await this.notifRepo.save(entity);

    if (params.push !== false) {
      this.pushService
        .sendToUser(params.userId, {
          title: params.title,
          body: params.message,
          url: '/notifications',
        })
        .catch((error) => {
          this.logger.warn(`Push notification failed: ${error}`);
        });
    }

    return saved;
  }

  public async findByUser(userId: string, limit = 50, offset = 0): Promise<{ data: NotificationOrmEntity[]; total: number }> {
    const [data, total] = await this.notifRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }

  public async countUnread(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }

  public async markAsRead(id: string, userId: string): Promise<void> {
    await this.notifRepo.update({ id, userId }, { isRead: true });
  }

  public async markAllAsRead(userId: string): Promise<void> {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
  }
}
