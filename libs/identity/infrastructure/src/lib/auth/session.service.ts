import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TypeOrmSessionRepository } from '../repositories/typeorm-session.repository';
import { SessionOrmEntity } from '../entities/session-orm.entity';

export interface SessionMetadata {
  readonly deviceName?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface IssuedSession {
  readonly sessionId: string;
  readonly refreshToken: string;
}

export interface ValidatedSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly tenantId: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepo: TypeOrmSessionRepository) {}

  public hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  public generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  public async issueSession(
    userId: string,
    tenantId: string,
    ttlMs: number,
    metadata: SessionMetadata = {},
  ): Promise<IssuedSession> {
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + ttlMs);
    const session = await this.sessionRepo.createSession({
      userId,
      tenantId,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt,
      deviceName: metadata.deviceName,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
    return { sessionId: session.id, refreshToken };
  }

  /**
   * Refresh-token rotation: the presented token is validated and then
   * immediately replaced with a brand-new token + bumped token_version. This
   * makes replay of a stolen refresh token detectable and invalid.
   */
  public async validateAndRotate(
    refreshToken: string,
    ttlMs: number,
    metadata: SessionMetadata = {},
  ): Promise<ValidatedSession & IssuedSession> {
    const hash = this.hashRefreshToken(refreshToken);
    const session = await this.sessionRepo.findByRefreshHash(hash);
    if (!session || this.isRevoked(session) || this.isExpired(session)) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const newToken = this.generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + ttlMs);
    await this.sessionRepo.rotateRefreshToken(session.id, {
      refreshTokenHash: this.hashRefreshToken(newToken),
      expiresAt: newExpiresAt,
      metadata,
    });

    return {
      sessionId: session.id,
      userId: session.userId,
      tenantId: session.tenantId,
      refreshToken: newToken,
    };
  }

  public async revoke(refreshToken: string): Promise<void> {
    const session = await this.sessionRepo.findByRefreshHash(this.hashRefreshToken(refreshToken));
    if (session && !session.revokedAt) {
      await this.sessionRepo.revoke(session.id);
    }
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllForUser(userId);
  }

  public async revokeAllForUserExcept(userId: string, sessionId: string): Promise<void> {
    await this.sessionRepo.revokeAllForUserExcept(userId, sessionId);
  }

  public async findActiveByUserId(userId: string): Promise<SessionOrmEntity[]> {
    return this.sessionRepo.findActiveByUserId(userId);
  }

  public async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepo.findById(sessionId);
    return !!session && !this.isRevoked(session) && !this.isExpired(session);
  }

  public isRevoked(session: SessionOrmEntity): boolean {
    return !!session.revokedAt;
  }

  public isExpired(session: SessionOrmEntity): boolean {
    return new Date() > session.expiresAt;
  }
}
