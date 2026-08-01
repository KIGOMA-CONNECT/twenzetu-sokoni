import { UnauthorizedException } from '@nestjs/common';
import { SessionService } from '@afri-market/identity-infrastructure';
import { SessionOrmEntity } from '@afri-market/identity-infrastructure';

describe('SessionService', () => {
  let service: SessionService;
  let repo: {
    createSession: jest.Mock;
    findByRefreshHash: jest.Mock;
    findById: jest.Mock;
    rotateRefreshToken: jest.Mock;
    revoke: jest.Mock;
    revokeAllForUser: jest.Mock;
  };

  const fakeSession = (overrides: Partial<SessionOrmEntity> = {}): SessionOrmEntity =>
    ({
      id: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      refreshTokenHash: 'hash',
      tokenVersion: 1,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      ...overrides,
    }) as SessionOrmEntity;

  beforeEach(() => {
    repo = {
      createSession: jest.fn(),
      findByRefreshHash: jest.fn(),
      findById: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    service = new SessionService(repo as never);
  });

  describe('hashRefreshToken', () => {
    it('produces a stable sha256 hex digest', () => {
      const a = service.hashRefreshToken('token');
      const b = service.hashRefreshToken('token');
      expect(a).toBe(b);
      expect(a).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('issueSession', () => {
    it('stores only the hash and returns the raw token', async () => {
      repo.createSession.mockResolvedValue(fakeSession());
      const issued = await service.issueSession('user-1', 'tenant-1', 3_600_000, { deviceName: 'Pixel' });

      expect(repo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', tenantId: 'tenant-1', deviceName: 'Pixel' }),
      );
      expect(issued.refreshToken).not.toEqual(repo.createSession.mock.calls[0][0].refreshTokenHash);
      expect(issued.sessionId).toBe('session-1');
    });
  });

  describe('validateAndRotate', () => {
    it('rotates the refresh token hash and bumps expiry', async () => {
      repo.findByRefreshHash.mockResolvedValue(fakeSession());
      const result = await service.validateAndRotate('raw-token', 3_600_000);

      expect(result.refreshToken).not.toBe('raw-token');
      expect(repo.rotateRefreshToken).toHaveBeenCalledTimes(1);
      expect(repo.rotateRefreshToken.mock.calls[0][0]).toBe('session-1');
    });

    it('rejects an unknown refresh token', async () => {
      repo.findByRefreshHash.mockResolvedValue(null);
      await expect(service.validateAndRotate('nope', 3_600_000)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repo.rotateRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects a revoked session', async () => {
      repo.findByRefreshHash.mockResolvedValue(fakeSession({ revokedAt: new Date() }));
      await expect(service.validateAndRotate('raw', 3_600_000)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an expired session', async () => {
      repo.findByRefreshHash.mockResolvedValue(
        fakeSession({ expiresAt: new Date(Date.now() - 60_000) }),
      );
      await expect(service.validateAndRotate('raw', 3_600_000)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('revoke', () => {
    it('revokes the session found by the token hash', async () => {
      repo.findByRefreshHash.mockResolvedValue(fakeSession());
      await service.revoke('raw-token');
      expect(repo.revoke).toHaveBeenCalledWith('session-1');
    });

    it('does nothing when the token is unknown', async () => {
      repo.findByRefreshHash.mockResolvedValue(null);
      await service.revoke('raw-token');
      expect(repo.revoke).not.toHaveBeenCalled();
    });
  });

  describe('isSessionValid', () => {
    it('returns true for a live session', async () => {
      repo.findById.mockResolvedValue(fakeSession());
      await expect(service.isSessionValid('session-1')).resolves.toBe(true);
    });

    it('returns false for a revoked or expired session', async () => {
      repo.findById.mockResolvedValue(fakeSession({ revokedAt: new Date() }));
      await expect(service.isSessionValid('session-1')).resolves.toBe(false);
      repo.findById.mockResolvedValue(fakeSession({ expiresAt: new Date(Date.now() - 5) }));
      await expect(service.isSessionValid('session-1')).resolves.toBe(false);
    });
  });
});
