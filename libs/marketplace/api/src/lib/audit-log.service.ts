import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity, Repository } from 'typeorm';
import { AuditLogOrmEntity } from '@afri-market/marketplace-infrastructure';

export interface AuditLogInput {
  action: string;
  actorId: string;
  actorRole?: string;
  tenantId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  public async log(input: AuditLogInput): Promise<void> {
    await this.repo.insert({
      action: input.action,
      actorId: input.actorId,
      actorRole: input.actorRole ?? null,
      tenantId: input.tenantId ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: (input.metadata ?? null) as unknown as QueryDeepPartialEntity<Record<string, unknown> | null>,
      ipAddress: input.ipAddress ?? null,
    });
  }

  public async list(input: {
    tenantId?: string;
    actorId?: string;
    action?: string;
    limit: number;
    offset: number;
  }): Promise<{ rows: AuditLogOrmEntity[]; total: number }> {
    const query = this.repo.createQueryBuilder('a');

    if (input.tenantId) {
      query.andWhere('a.tenant_id = :tenantId', { tenantId: input.tenantId });
    }
    if (input.actorId) {
      query.andWhere('a.actor_id = :actorId', { actorId: input.actorId });
    }
    if (input.action) {
      query.andWhere('a.action = :action', { action: input.action });
    }

    const [rows, total] = await query
      .orderBy('a.created_at', 'DESC')
      .skip(input.offset)
      .take(input.limit)
      .getManyAndCount();

    return { rows, total };
  }
}
