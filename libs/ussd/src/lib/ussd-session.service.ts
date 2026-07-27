import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UssdSessionEntity } from './entities/ussd-session.entity';
import { UssdSession } from './ussd.types';
import { USSD_SESSION_TTL } from './ussd.constants';

@Injectable()
export class UssdSessionService {
  constructor(
    @InjectRepository(UssdSessionEntity)
    private readonly sessionRepo: Repository<UssdSessionEntity>,
  ) {}

  async getOrCreateSession(
    phoneNumber: string,
    tenantId: string,
    sessionId: string,
  ): Promise<UssdSession> {
    let existing = await this.sessionRepo.findOne({
      where: { sessionId, phoneNumber },
    });

    if (existing && this.isNotExpired(existing)) {
      return this.toDomain(existing);
    }

    if (existing) {
      await this.sessionRepo.remove(existing);
    }

    const newSession: UssdSession = {
      sessionId,
      phoneNumber,
      tenantId,
      currentMenu: 'main',
      data: {},
      cart: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    const entity = this.toEntity(newSession);
    await this.sessionRepo.save(entity);
    return newSession;
  }

  async saveSession(session: UssdSession): Promise<void> {
    session.lastAccessedAt = Date.now();
    const existing = await this.sessionRepo.findOne({
      where: { sessionId: session.sessionId, phoneNumber: session.phoneNumber },
    });

    if (existing) {
      existing.data = session.data;
      existing.cart = session.cart;
      existing.currentMenu = session.currentMenu;
      existing.userId = session.userId;
      existing.userRole = session.userRole;
      existing.lastAccessedAt = new Date(session.lastAccessedAt);
      await this.sessionRepo.save(existing);
    } else {
      await this.sessionRepo.save(this.toEntity(session));
    }
  }

  async endSession(sessionId: string, phoneNumber: string): Promise<void> {
    await this.sessionRepo.delete({ sessionId, phoneNumber });
  }

  async cleanupExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - USSD_SESSION_TTL * 1000);
    const result = await this.sessionRepo
      .createQueryBuilder()
      .delete()
      .where('last_accessed_at < :cutoff', { cutoff })
      .execute();
    return result.affected || 0;
  }

  private isNotExpired(entity: UssdSessionEntity): boolean {
    const ttlMs = USSD_SESSION_TTL * 1000;
    return Date.now() - entity.lastAccessedAt.getTime() < ttlMs;
  }

  private toDomain(entity: UssdSessionEntity): UssdSession {
    return {
      sessionId: entity.sessionId,
      phoneNumber: entity.phoneNumber,
      tenantId: entity.tenantId,
      userId: entity.userId,
      userRole: entity.userRole,
      currentMenu: entity.currentMenu,
      data: entity.data || {},
      cart: entity.cart || [],
      createdAt: entity.createdAt.getTime(),
      lastAccessedAt: entity.lastAccessedAt.getTime(),
    };
  }

  private toEntity(session: UssdSession): UssdSessionEntity {
    const entity = new UssdSessionEntity();
    entity.sessionId = session.sessionId;
    entity.phoneNumber = session.phoneNumber;
    entity.tenantId = session.tenantId;
    entity.userId = session.userId;
    entity.userRole = session.userRole;
    entity.currentMenu = session.currentMenu;
    entity.data = session.data;
    entity.cart = session.cart;
    entity.createdAt = new Date(session.createdAt);
    entity.lastAccessedAt = new Date(session.lastAccessedAt);
    return entity;
  }
}
