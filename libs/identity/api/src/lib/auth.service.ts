import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityId, TenantId, PhoneNumber, Email } from '@afri-market/kernel';
import { User, Tenant, UserRole } from '@afri-market/identity-domain';
import { IUserRepository, ITenantRepository } from '@afri-market/identity-domain';
import { AppConfigService } from '@afri-market/core-config';
import { IPasswordHasher } from '@afri-market/identity-infrastructure';
import {
  TypeOrmOtpRepository,
  TypeOrmSessionRepository,
  SessionService,
  SessionMetadata,
  USER_REPOSITORY,
  TENANT_REPOSITORY,
  JwtPayload,
} from '@afri-market/identity-infrastructure';
import { SmsService, EmailService } from '@afri-market/integrations';

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
    private readonly otpRepo: TypeOrmOtpRepository,
    private readonly sessionRepo: TypeOrmSessionRepository,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    @Inject('IPasswordHasher') private readonly hasher: IPasswordHasher,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  public async registerTenant(name: string): Promise<{ tenantId: string }> {
    const tenant = Tenant.create({ name });
    await this.tenantRepo.save(tenant);
    return { tenantId: tenant.id.value };
  }

  public async registerUser(
    tenantId: string,
    phoneNumber: string,
    fullName: string,
    role: UserRole,
    password: string,
    email?: string,
  ): Promise<{ userId: string }> {
    const existing = await this.userRepo.findByPhoneNumber(phoneNumber);
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }
    const passwordHash = await this.hasher.hash(password);
    const user = User.create({
      tenantId: TenantId.create(tenantId),
      phoneNumber: PhoneNumber.create(phoneNumber),
      fullName,
      role,
      passwordHash,
      email: email ? Email.create(email) : undefined,
    });
    user.verify();
    await this.userRepo.save(user);
    this.emailService.sendWelcome(email ?? '', fullName).catch(() => {});
    return { userId: user.id.value };
  }

  public async login(
    phoneNumber: string,
    password: string,
    metadata: SessionMetadata = {},
  ): Promise<TokenBundle & { user: Record<string, unknown> }> {
    const user = await this.userRepo.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.hasher.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.assertActive(user);

    const tokens = await this.issueTokens(user, metadata);
    return {
      ...tokens,
      user: this.toUserDto(user),
    };
  }

  public async getProfile(userId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toUserDto(user);
  }

  public async updateProfile(
    userId: string,
    updates: { fullName?: string; email?: string },
  ): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (updates.fullName !== undefined) {
      user.updateFullName(updates.fullName);
    }
    if (updates.email !== undefined) {
      user.updateEmail(updates.email ? Email.create(updates.email) : undefined);
    }
    await this.userRepo.save(user);
    return this.getProfile(userId);
  }

  public async sendOtp(phoneNumber: string): Promise<{ message: string }> {
    await this.otpRepo.invalidateAll(phoneNumber);
    const code = this.generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.config.otp.expiryMinutes);
    await this.otpRepo.create(phoneNumber, code, expiresAt);
    await this.smsService.sendOtp(phoneNumber, code);
    return { message: `OTP sent to ${phoneNumber}` };
  }

  /**
   * Verifies an OTP and, when the phone belongs to an existing ACTIVE user,
   * issues a full token bundle (session-persistent). New/existing numbers are
   * signalled via `registered` so the client can route to registration.
   */
  public async verifyOtp(
    phoneNumber: string,
    code: string,
    metadata: SessionMetadata = {},
  ): Promise<
    | { verified: true; registered: true; accessToken: string; refreshToken: string; user: Record<string, unknown> }
    | { verified: true; registered: false }
    | { verified: false; registered: false }
  > {
    const otp = await this.otpRepo.findValid(phoneNumber, code);
    if (!otp) {
      return { verified: false, registered: false };
    }
    await this.otpRepo.markUsed(otp.id);

    const user = await this.userRepo.findByPhoneNumber(phoneNumber);
    if (!user) {
      return { verified: true, registered: false };
    }
    this.assertActive(user);

    const tokens = await this.issueTokens(user, metadata);
    return {
      verified: true,
      registered: true,
      ...tokens,
      user: this.toUserDto(user),
    };
  }

  public async refresh(refreshToken: string, metadata: SessionMetadata = {}): Promise<TokenBundle> {
    const rotated = await this.sessionService.validateAndRotate(
      refreshToken,
      this.refreshTtlMs(),
      metadata,
    );
    const user = await this.userRepo.findById(EntityId.from(rotated.userId));
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    this.assertActive(user);

    const accessToken = await this.signAccessToken(user, rotated.sessionId);
    return {
      accessToken,
      refreshToken: rotated.refreshToken,
    };
  }

  public async logout(refreshToken: string): Promise<{ success: boolean }> {
    await this.sessionService.revoke(refreshToken);
    return { success: true };
  }

  public async suspend(userId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.suspend();
    await this.userRepo.save(user);
    await this.sessionService.revokeAllForUser(user.id.value);
    return this.toUserDto(user);
  }

  public async unsuspend(userId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.activate();
    await this.userRepo.save(user);
    return this.toUserDto(user);
  }

  private async issueTokens(user: User, metadata: SessionMetadata): Promise<TokenBundle> {
    const issued = await this.sessionService.issueSession(
      user.id.value,
      user.tenantId.value,
      this.refreshTtlMs(),
      metadata,
    );
    const accessToken = await this.signAccessToken(user, issued.sessionId);
    return { accessToken, refreshToken: issued.refreshToken };
  }

  private async signAccessToken(user: User, sessionId: string): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id.value,
      tenantId: user.tenantId.value,
      role: user.role,
      phoneNumber: user.phoneNumber.value,
      permissions: user.permissions.length > 0 ? user.permissions.join(',') : '',
      sid: sessionId,
      tokenType: 'access',
    };
    return this.jwtService.sign(payload);
  }

  private refreshTtlMs(): number {
    return this.parseDurationToMs(this.config.jwt.refreshExpiry);
  }

  private parseDurationToMs(duration: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
    if (!match) {
      return 30 * 24 * 60 * 60 * 1000;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return value * (multipliers[unit] ?? 86_400_000);
  }

  private assertActive(user: User): void {
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended. Contact support.');
    }
  }

  private toUserDto(user: User): Record<string, unknown> {
    return {
      id: user.id.value,
      tenantId: user.tenantId.value,
      phoneNumber: user.phoneNumber.value,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      email: user.email?.value ?? null,
      permissions: user.permissions,
    };
  }

  private generateOtpCode(): string {
    const length = this.config.otp.length;
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }
}
