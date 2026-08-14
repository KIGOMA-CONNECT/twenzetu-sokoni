import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EntityId, TenantId, PhoneNumber, Email } from '@afri-market/kernel';
import { User } from '@afri-market/identity-domain';
import { AuthService } from './auth.service';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

function makeUser(overrides: Partial<Parameters<typeof User.reconstitute>[0]> = {}): User {
  return User.reconstitute({
    id: EntityId.create(),
    tenantId: TenantId.create(TENANT_ID),
    phoneNumber: PhoneNumber.create('+250788123456'),
    fullName: 'Test User',
    role: 'customer',
    passwordHash: 'current-hash',
    status: 'ACTIVE',
    version: 1,
    email: Email.create('test@example.com'),
    ...overrides,
  });
}

function makeService(mocks: Record<string, jest.Mock> = {}) {
  const userRepo = {
    findByPhoneNumber: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    ...(mocks['userRepo'] ?? {}),
  };
  const tenantRepo = { findDefault: jest.fn(), findById: jest.fn() };
  const otpRepo = {
    invalidateAll: jest.fn(),
    create: jest.fn(),
    consume: jest.fn(),
    markUsed: jest.fn(),
  };
  const sessionRepo = { revoke: jest.fn(), findById: jest.fn() };
  const sessionService = {
    issueSession: jest.fn(),
    validateAndRotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
    revokeAllForUserExcept: jest.fn(),
    findActiveByUserId: jest.fn(),
  };
  const jwtService = { sign: jest.fn() };
  const config = { otp: { expiryMinutes: 5, length: 4 }, jwt: { refreshExpiry: '30d' } } as never;
  const hasher = {
    hash: jest.fn().mockResolvedValue('new-hash'),
    verify: jest.fn().mockResolvedValue(true),
  };
  const smsService = { sendOtp: jest.fn() };
  const emailService = { sendWelcome: jest.fn() };
  const aiVerification = { evaluate: jest.fn() };

  const service = new AuthService(
    userRepo as never,
    tenantRepo as never,
    otpRepo as never,
    sessionRepo as never,
    sessionService as never,
    jwtService as never,
    config,
    hasher as never,
    smsService as never,
    emailService as never,
    aiVerification as never,
  );

  return { service, userRepo, otpRepo, sessionRepo, sessionService, hasher, smsService };
}

describe('AuthService — self-service account management', () => {
  describe('changePassword', () => {
    it('updates the hash and revokes every other session on success', async () => {
      const user = makeUser();
      const mocks = makeService();
      mocks.userRepo.findById.mockResolvedValue(user);

      const result = await mocks.service.changePassword(user.id.value, 'oldPass1', 'newP@ss1', 'session-1');

      expect(result).toEqual({ success: true });
      expect(mocks.hasher.verify).toHaveBeenCalledWith('current-hash', 'oldPass1');
      expect(mocks.hasher.hash).toHaveBeenCalledWith('newP@ss1');
      expect(mocks.userRepo.save).toHaveBeenCalled();
      expect(mocks.sessionService.revokeAllForUserExcept).toHaveBeenCalledWith(user.id.value, 'session-1');
    });

    it('throws UnauthorizedException when the current password is wrong', async () => {
      const user = makeUser();
      const mocks = makeService();
      mocks.userRepo.findById.mockResolvedValue(user);
      mocks.hasher.verify.mockResolvedValue(false);

      await expect(
        mocks.service.changePassword(user.id.value, 'wrong', 'newP@ss1', 'session-1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mocks.userRepo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a weak new password', async () => {
      const user = makeUser();
      const mocks = makeService();
      mocks.userRepo.findById.mockResolvedValue(user);

      await expect(
        mocks.service.changePassword(user.id.value, 'oldPass1', 'weak', 'session-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.hasher.hash).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown user', async () => {
      const mocks = makeService();
      mocks.userRepo.findById.mockResolvedValue(null);

      await expect(
        mocks.service.changePassword(EntityId.create().value, 'oldPass1', 'newP@ss1', 'session-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('forgotPassword', () => {
    it('sends an OTP when the phone is registered', async () => {
      const mocks = makeService();
      mocks.userRepo.findByPhoneNumber.mockResolvedValue(makeUser());

      const result = await mocks.service.forgotPassword('+250788123456');

      expect(result.message).toContain('OTP has been sent');
      expect(mocks.otpRepo.invalidateAll).toHaveBeenCalledWith('+250788123456');
      expect(mocks.otpRepo.create).toHaveBeenCalled();
      expect(mocks.smsService.sendOtp).toHaveBeenCalledWith('+250788123456', expect.any(String));
    });

    it('never reveals whether the phone is registered and sends nothing for unknown numbers', async () => {
      const mocks = makeService();
      mocks.userRepo.findByPhoneNumber.mockResolvedValue(null);

      const result = await mocks.service.forgotPassword('+250788999999');

      expect(result.message).toContain('If that phone number is registered');
      expect(mocks.otpRepo.create).not.toHaveBeenCalled();
      expect(mocks.smsService.sendOtp).not.toHaveBeenCalled();
    });

    it('rate-limits repeated requests', async () => {
      const mocks = makeService();
      mocks.userRepo.findByPhoneNumber.mockResolvedValue(null);

      for (let i = 0; i < 5; i++) {
        await mocks.service.forgotPassword('+250788123456');
      }
      await expect(mocks.service.forgotPassword('+250788123456')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('resetPassword', () => {
    it('rejects an invalid or expired code', async () => {
      const mocks = makeService();
      mocks.otpRepo.consume.mockResolvedValue(null);

      await expect(
        mocks.service.resetPassword('+250788123456', '0000', 'newP@ss1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mocks.userRepo.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown phone even with a valid code', async () => {
      const mocks = makeService();
      mocks.otpRepo.consume.mockResolvedValue({ id: 'otp-1' });
      mocks.userRepo.findByPhoneNumber.mockResolvedValue(null);

      await expect(
        mocks.service.resetPassword('+250788123456', '0000', 'newP@ss1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates the hash and revokes all sessions on success', async () => {
      const user = makeUser();
      const mocks = makeService();
      mocks.otpRepo.consume.mockResolvedValue({ id: 'otp-1' });
      mocks.userRepo.findByPhoneNumber.mockResolvedValue(user);

      const result = await mocks.service.resetPassword('+250788123456', '0000', 'newP@ss1');

      expect(result).toEqual({ success: true });
      expect(mocks.hasher.hash).toHaveBeenCalledWith('newP@ss1');
      expect(mocks.userRepo.save).toHaveBeenCalled();
      expect(mocks.sessionService.revokeAllForUser).toHaveBeenCalledWith(user.id.value);
    });

    it('throws BadRequestException for a weak new password', async () => {
      const mocks = makeService();
      mocks.otpRepo.consume.mockResolvedValue({ id: 'otp-1' });
      mocks.userRepo.findByPhoneNumber.mockResolvedValue(makeUser());

      await expect(
        mocks.service.resetPassword('+250788123456', '0000', 'weak'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listSessions', () => {
    it('maps active sessions and flags the current one', async () => {
      const mocks = makeService();
      const now = new Date();
      mocks.sessionService.findActiveByUserId.mockResolvedValue([
        { id: 's1', deviceName: 'Chrome', ipAddress: '1.1.1.1', userAgent: null, createdAt: now, expiresAt: now },
        { id: 's2', deviceName: 'Phone', ipAddress: '2.2.2.2', userAgent: 'x', createdAt: now, expiresAt: now },
      ]);

      const sessions = await mocks.service.listSessions('user-1', 's2');

      expect(sessions).toHaveLength(2);
      expect(sessions[0]['isCurrent']).toBe(false);
      expect(sessions[1]['isCurrent']).toBe(true);
      expect(sessions[1]['deviceName']).toBe('Phone');
    });
  });

  describe('revokeSession', () => {
    it('refuses to revoke the current session', async () => {
      const mocks = makeService();
      mocks.sessionService.findActiveByUserId.mockResolvedValue([
        { id: 's1', deviceName: 'Chrome', ipAddress: null, userAgent: null, createdAt: new Date(), expiresAt: new Date() },
      ]);

      await expect(mocks.service.revokeSession('user-1', 's1', 's1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.sessionRepo.revoke).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a session that does not belong to the user', async () => {
      const mocks = makeService();
      mocks.sessionService.findActiveByUserId.mockResolvedValue([
        { id: 's1', deviceName: 'Chrome', ipAddress: null, userAgent: null, createdAt: new Date(), expiresAt: new Date() },
      ]);

      await expect(mocks.service.revokeSession('user-1', 's-other', 's-current')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('revokes a target session on success', async () => {
      const mocks = makeService();
      mocks.sessionService.findActiveByUserId.mockResolvedValue([
        { id: 's1', deviceName: 'Chrome', ipAddress: null, userAgent: null, createdAt: new Date(), expiresAt: new Date() },
        { id: 's2', deviceName: 'Phone', ipAddress: null, userAgent: null, createdAt: new Date(), expiresAt: new Date() },
      ]);

      const result = await mocks.service.revokeSession('user-1', 's1', 's2');

      expect(result).toEqual({ success: true });
      expect(mocks.sessionRepo.revoke).toHaveBeenCalledWith('s1');
    });

    it('revokes every session when asked to sign out everywhere', async () => {
      const mocks = makeService();

      const result = await mocks.service.revokeAllSessions('user-1');

      expect(result).toEqual({ success: true });
      expect(mocks.sessionService.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });
  });
});
