import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';
import { QueueService } from '@afri-market/core-queue';

export interface AuditContext {
  tenantId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  status?: string;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    private readonly queueService: QueueService,
  ) {}

  async log(ctx: AuditContext, entry: AuditEntry): Promise<void> {
    try {
      // Write to queue for async processing (non-blocking)
      await this.queueService.addAuditJob({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        oldData: entry.oldData,
        newData: entry.newData,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    } catch (error) {
      // Fallback: write directly to DB if queue is down
      this.logger.error(`Queue write failed, writing directly: ${error}`);
      await this.writeDirect(ctx, entry);
    }
  }

  async logSync(ctx: AuditContext, entry: AuditEntry): Promise<AuditLogEntity> {
    // For critical operations that must be logged immediately
    const record = this.auditRepo.create({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      oldData: entry.oldData,
      newData: entry.newData,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      status: entry.status ?? 'success',
      errorMessage: entry.errorMessage,
      immutable: true,
    });

    return this.auditRepo.save(record);
  }

  private async writeDirect(ctx: AuditContext, entry: AuditEntry): Promise<void> {
    const record = this.auditRepo.create({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      oldData: entry.oldData,
      newData: entry.newData,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      status: entry.status ?? 'success',
      errorMessage: entry.errorMessage,
      immutable: true,
    });

    await this.auditRepo.save(record);
  }

  async query(tenantId: string, filters: {
    entity?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLogEntity[]; total: number }> {
    const qb = this.auditRepo.createQueryBuilder('audit')
      .where('audit.tenantId = :tenantId', { tenantId });

    if (filters.entity) {
      qb.andWhere('audit.entity = :entity', { entity: filters.entity });
    }
    if (filters.entityId) {
      qb.andWhere('audit.entityId = :entityId', { entityId: filters.entityId });
    }
    if (filters.userId) {
      qb.andWhere('audit.userId = :userId', { userId: filters.userId });
    }
    if (filters.action) {
      qb.andWhere('audit.action = :action', { action: filters.action });
    }
    if (filters.startDate) {
      qb.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const [data, total] = await qb
      .orderBy('audit.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { data, total };
  }
}
