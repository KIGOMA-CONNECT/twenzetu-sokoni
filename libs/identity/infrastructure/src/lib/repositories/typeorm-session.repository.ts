import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, QueryDeepPartialEntity, Repository } from 'typeorm';
import { SessionOrmEntity } from '../entities/session-orm.entity';
import type { SessionMetadata } from '../auth/session.service';

export interface CreateSessionParams {
  readonly userId: string;
  readonly tenantId: string;
  readonly refreshTokenHash: string;
  readonly expiresAt: Date;
  readonly deviceName?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

@Injectable()
export class TypeOrmSessionRepository {
  constructor(
    @InjectRepository(SessionOrmEntity)
    private readonly repo: Repository<SessionOrmEntity>,
  ) {}

  public async createSession(params: CreateSessionParams): Promise<SessionOrmEntity> {
    const session = this.repo.create({
      userId: params.userId,
      tenantId: params.tenantId,
      refreshTokenHash: params.refreshTokenHash,
      tokenVersion: 1,
      expiresAt: params.expiresAt,
      deviceName: params.deviceName ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      revokedAt: null,
    });
    return this.repo.save(session);
  }

  public async findById(id: string): Promise<SessionOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async findByRefreshHash(refreshTokenHash: string): Promise<SessionOrmEntity | null> {
    return this.repo.findOne({ where: { refreshTokenHash } });
  }

  public async findByUserId(userId: string): Promise<SessionOrmEntity[]> {
    return this.repo.find({ where: { userId } });
  }

  public async rotateRefreshToken(
    id: string,
    params: { refreshTokenHash: string; expiresAt: Date; metadata?: SessionMetadata },
  ): Promise<void> {
    const patch: QueryDeepPartialEntity<SessionOrmEntity> = {
      refreshTokenHash: params.refreshTokenHash,
      tokenVersion: () => '"token_version" + 1',
      expiresAt: params.expiresAt,
    };
    if (params.metadata) {
      if (params.metadata.deviceName) patch.deviceName = params.metadata.deviceName;
      if (params.metadata.ipAddress) patch.ipAddress = params.metadata.ipAddress;
      if (params.metadata.userAgent) patch.userAgent = params.metadata.userAgent;
    }
    await this.repo.update(id, patch);
  }

  public async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update({ userId }, { revokedAt: new Date() });
  }

  public async deleteExpired(before: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('"expires_at" < :before', { before })
      .execute();
    return result.affected ?? 0;
  }

  public async countActiveForUser(userId: string): Promise<number> {
    return this.repo.count({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
