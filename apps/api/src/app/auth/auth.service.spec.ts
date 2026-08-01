import { UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { EntityId, TenantId, PhoneNumber, Email } from '@afri-market/kernel';
import { User } from '@afri-market/identity-domain';
import { AuthService } from '@afri-market/identity-api';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@afri-market/core-config';

const buildUser = (overrides: Partial<User> = {}): User =>
  User.reconstitute({
    id: EntityId.from('11111111-1111-1111-1111-111111111111'),
    tenantId: TenantId.create('22222222-2222-2222-2222-222222222222'),
    phoneNumber: PhoneNumber.create('+255754100003'),
    fullName: 'Demo Customer',
    role: 'customer',
    passwordHash: 'hash',
    email: Email.create('customer@example.com'),
    status: 'ACTIVE',
    version: 1,
    ...overrides,
  });

describe('AuthService', () => {
  const userRepo = { findByPhoneNumber: jest.fn(), findById: jest.fn(), save: jest.fn() };
  const tenantRepo = { save: jest.fn() };
  const otpRepo = { invalidateAll: jest.fn(), create: jest.fn(), findValid: jest.fn(), markUsed: jest.fn() };
  const sessionRepo = {} as never;
  const sessionService = {
    issueSession: jest.fn(),
    validateAndRotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
  const jwtService = { sign: jest.fn(() => 'signed-token') } as unknown as JwtService;
  const config = {
    jwt: { refreshExpiry: '30d' },
    otp: { expiryMinutes: 5, length: 4 },
  } as unknown as AppConfigService;
  const hasher = { hash: jest.fn(async (p: string) => `hashed:${p}`), verify: jest.fn() };
  const smsService = { sendOtp: jest.fn(), sendOrderConfirmation: jest.fn() };
  const emailService = { sendWelcome: jest.fn(async () => undefined), sendEmail: jest.fn() };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userRepo as never,
      tenantRepo as never,
      otpRepo as never,
      sessionRepo,
      sessionService as never,
      jwtService,
      config,
      hasher as never,
      smsService as never,
      emailService as never,
    );
  });

  describe('login', () => {
    it('issues a token bundle for valid credentials', async () => {
      userRepo.findByPhoneNumber.mockResolvedValue(buildUser());
      hasher.verify.mockResolvedValue(true);
      sessionService.issueSession.mockResolvedValue({ sessionId: 's-1', refreshToken: 'refresh' });

      const result = await service.login('+255754100003', 'password123', { deviceName: 'Pixel' });

      expect(sessionService.issueSession).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        expect.any(Number),
        { deviceName: 'Pixel' },
      );
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('refresh');
      expect(result.user.role).toBe('customer');
    });

    it('rejects unknown phone numbers', async () => {
      userRepo.findByPhoneNumber.mockResolvedValue(null);
      await expect(service.login('+255700000000', 'x')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      userRepo.findByPhoneNumber.mockResolvedValue(buildUser());
      hasher.verify.mockResolvedValue(false);
      await expect(service.login('+255754100003', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a suspended user', async () => {
      userRepo.findByPhoneNumber.mockResolvedValue(buildUser({ status: 'SUSPENDED' }));
      hasher.verify.mockResolvedValue(true);
      await expect(service.login('+255754100003', 'password123')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('registerUser', () => {
    it('creates and verifies a new user', async () => {
      userRepo.findByPhoneNumber.mockResolvedValue(null);
      const result = await service.registerUser(
        '22222222-2222-2222-2222-222222222222',
        '+255754100005',
        'New User',
        'customer',
        'password123',
      );
      expect(userRepo.save).toHaveBeenCalledWith(expect.any(User));
      expect(result.userId).toBeTruthy();
    });

    it('rejects a duplicate phone number', async () => {
      userRepo.findByPhoneNumber.mockResolvedValue(buildUser());
      await expect(
        service.registerUser('t', '+255754100003', 'Dup', 'customer', 'x'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('sendOtp / verifyOtp', () => {
    it('invalidates old codes before issuing a new one', async () => {
      await service.sendOtp('+255754100003');
      expect(otpRepo.invalidateAll).toHaveBeenCalledWith('+255754100003');
      expect(otpRepo.create).toHaveBeenCalled();
      expect(smsService.sendOtp).toHaveBeenCalledWith('+255754100003', expect.stringMatching(/^\d{4}$/));
    });

    it('returns a token bundle for a registered ACTIVE user', async () => {
      otpRepo.findValid.mockResolvedValue({ id: 'otp-1' });
      userRepo.findByPhoneNumber.mockResolvedValue(buildUser());
      sessionService.issueSession.mockResolvedValue({ sessionId: 's-1', refreshToken: 'refresh' });

      const result = await service.verifyOtp('+255754100003', '1234');

      expect(otpRepo.markUsed).toHaveBeenCalledWith('otp-1');
      expect(result).toMatchObject({ verified: true, registered: true, refreshToken: 'refresh' });
    });

    it('signals registration needed for an unknown number', async () => {
      otpRepo.findValid.mockResolvedValue({ id: 'otp-2' });
      userRepo.findByPhoneNumber.mockResolvedValue(null);
      const result = await service.verifyOtp('+255700000000', '1234');
      expect(result).toEqual({ verified: true, registered: false });
    });

    it('does not issue tokens for a suspended user', async () => {
      otpRepo.findValid.mockResolvedValue({ id: 'otp-3' });
      userRepo.findByPhoneNumber.mockResolvedValue(buildUser({ status: 'SUSPENDED' }));
      await expect(service.verifyOtp('+255754100003', '1234')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh / logout', () => {
    it('rotates the refresh token and issues a new access token', async () => {
      sessionService.validateAndRotate.mockResolvedValue({
        sessionId: 's-1',
        userId: '11111111-1111-1111-1111-111111111111',
        tenantId: '22222222-2222-2222-2222-222222222222',
        refreshToken: 'new-refresh',
      });
      userRepo.findById.mockResolvedValue(buildUser());

      const result = await service.refresh('old-refresh');

      expect(sessionService.validateAndRotate).toHaveBeenCalledWith('old-refresh', expect.any(Number), {});
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('revokes the presented refresh token on logout', async () => {
      await service.logout('token-to-revoke');
      expect(sessionService.revoke).toHaveBeenCalledWith('token-to-revoke');
    });
  });

  describe('suspend / unsuspend', () => {
    it('suspends the user and force-logouts every session', async () => {
      userRepo.findById.mockResolvedValue(buildUser());
      const result = await service.suspend('11111111-1111-1111-1111-111111111111');
      expect(sessionService.revokeAllForUser).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
      expect(result.status).toBe('SUSPENDED');
    });

    it('reactivates a suspended user', async () => {
      userRepo.findById.mockResolvedValue(buildUser({ status: 'SUSPENDED' }));
      const result = await service.unsuspend('11111111-1111-1111-1111-111111111111');
      expect(result.status).toBe('ACTIVE');
    });

    it('throws NotFound for unknown users', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.suspend('11111111-1111-1111-1111-111111111111')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getProfile / updateProfile', () => {
    it('returns the user DTO', async () => {
      userRepo.findById.mockResolvedValue(buildUser());
      const dto = await service.getProfile('11111111-1111-1111-1111-111111111111');
      expect(dto.phoneNumber).toBe('+255754100003');
    });

    it('updates fullName and email', async () => {
      const user = buildUser();
      userRepo.findById.mockResolvedValue(user);
      await service.updateProfile('11111111-1111-1111-1111-111111111111', {
        fullName: 'New Name',
        email: 'new@example.com',
      });
      expect(userRepo.save).toHaveBeenCalled();
      expect(user.fullName).toBe('New Name');
    });
  });
});
