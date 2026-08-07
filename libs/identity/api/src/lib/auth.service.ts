import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { EntityId, TenantId, PhoneNumber, Email } from '@afri-market/kernel';
import { User, Tenant, UserRole } from '@afri-market/identity-domain';
import { IUserRepository, ITenantRepository } from '@afri-market/identity-domain';
import { AiVerificationService } from './verification.service';
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
import { SmsService, EmailService, normalizeE164 } from '@afri-market/integrations';

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
}

const OTP_SEND_LIMIT = 5;
const OTP_SEND_WINDOW_MS = 10 * 60 * 1000;
const OTP_VERIFY_LIMIT = 5;
const OTP_VERIFY_WINDOW_MS = 10 * 60 * 1000;

class InMemoryRateLimiter {
  private readonly buckets = new Map<string, number[]>();

  public isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (this.buckets.get(key) ?? []).filter((t) => t > cutoff);
    if (timestamps.length >= limit) {
      this.buckets.set(key, timestamps);
      return false;
    }
    timestamps.push(now);
    this.buckets.set(key, timestamps);
    return true;
  }
}

@Injectable()
export class AuthService {
  private readonly otpSendLimiter = new InMemoryRateLimiter();
  private readonly otpVerifyLimiter = new InMemoryRateLimiter();

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
    private readonly aiVerification: AiVerificationService,
  ) {}

  public async registerTenant(name: string): Promise<{ tenantId: string }> {
    const tenant = Tenant.create({ name });
    await this.tenantRepo.save(tenant);
    return { tenantId: tenant.id.value };
  }

  public async getDefaultTenant(): Promise<{ tenantId: string }> {
    const tenant = await this.tenantRepo.findDefault();
    if (!tenant) {
      throw new NotFoundException('No active tenant is configured');
    }
    return { tenantId: tenant.id.value };
  }

  public async registerUser(
    tenantId: string | undefined,
    phoneNumber: string,
    fullName: string,
    role: UserRole,
    password: string,
    email?: string,
    realInfo: { businessName?: string; ninOrRegNo?: string; city?: string } = {},
  ): Promise<{ userId: string }> {
    const canonicalPhone = this.canonicalizePhone(phoneNumber);
    const resolvedTenantId = tenantId ?? (await this.getDefaultTenant()).tenantId;
    const tenant = await this.tenantRepo.findById(EntityId.from(resolvedTenantId));
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const existing = await this.userRepo.findByPhoneNumber(canonicalPhone);
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }
    const passwordHash = await this.hasher.hash(password);

    const verification = await this.aiVerification.evaluate({
      role,
      fullName,
      businessName: realInfo.businessName,
      ninOrRegNo: realInfo.ninOrRegNo,
      city: realInfo.city,
    });

    const user = User.create({
      tenantId: TenantId.create(resolvedTenantId),
      phoneNumber: PhoneNumber.create(canonicalPhone),
      fullName,
      role,
      passwordHash,
      email: email ? Email.create(email) : undefined,
      businessName: realInfo.businessName,
      ninOrRegNo: realInfo.ninOrRegNo,
      city: realInfo.city,
      verificationRiskScore: verification.riskScore,
      verificationDocumentStatus: verification.documentStatus,
    });

    // Marketplace roles that require documents start in the pending/rejected
    // states and must be approved by an admin. Everyone else is verified on
    // registration as before.
    const requiresApproval = role === 'vendor' || role === 'driver';
    if (!requiresApproval || verification.documentStatus === 'APPROVED') {
      user.verify();
    }

    await this.userRepo.save(user);
    this.emailService.sendWelcome(email ?? '', fullName).catch(() => {});
    return { userId: user.id.value };
  }

  public async listPendingVerifications(tenantId?: string): Promise<Record<string, unknown>[]> {
    const users = await this.userRepo.findPendingVerifications(tenantId);
    return users.map((user) => this.toUserDto(user));
  }

  public async approveVerification(userId: string, callerTenantId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.tenantId.value !== callerTenantId) {
      throw new NotFoundException('User not found');
    }
    user.approveVerification();
    await this.userRepo.save(user);
    return this.toUserDto(user);
  }

  public async rejectVerification(
    userId: string,
    callerTenantId: string,
    reason: string,
  ): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.tenantId.value !== callerTenantId) {
      throw new NotFoundException('User not found');
    }
    user.rejectVerification(reason);
    await this.userRepo.save(user);
    return this.toUserDto(user);
  }

  public async login(
    phoneNumber: string,
    password: string,
    metadata: SessionMetadata = {},
  ): Promise<TokenBundle & { user: Record<string, unknown> }> {
    const user = await this.userRepo.findByPhoneNumber(this.canonicalizePhone(phoneNumber));
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
    const canonicalPhone = this.canonicalizePhone(phoneNumber);
    if (!this.otpSendLimiter.isAllowed(`send:${canonicalPhone}`, OTP_SEND_LIMIT, OTP_SEND_WINDOW_MS)) {
      throw new UnauthorizedException('Too many OTP requests for this phone number. Try again later.');
    }
    await this.otpRepo.invalidateAll(canonicalPhone);
    const code = this.generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.config.otp.expiryMinutes);
    await this.otpRepo.create(canonicalPhone, code, expiresAt);
    await this.smsService.sendOtp(canonicalPhone, code);
    return { message: `OTP sent to ${canonicalPhone}` };
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
    const canonicalPhone = this.canonicalizePhone(phoneNumber);
    if (!this.otpVerifyLimiter.isAllowed(`verify:${canonicalPhone}`, OTP_VERIFY_LIMIT, OTP_VERIFY_WINDOW_MS)) {
      return { verified: false, registered: false };
    }
    const otp = await this.otpRepo.consume(canonicalPhone, code);
    if (!otp) {
      return { verified: false, registered: false };
    }

    const user = await this.userRepo.findByPhoneNumber(canonicalPhone);
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

  public async suspend(userId: string, callerTenantId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.tenantId.value !== callerTenantId) {
      throw new NotFoundException('User not found');
    }
    user.suspend();
    await this.userRepo.save(user);
    await this.sessionService.revokeAllForUser(user.id.value);
    return this.toUserDto(user);
  }

  public async unsuspend(userId: string, callerTenantId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.tenantId.value !== callerTenantId) {
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
      businessName: user.businessName ?? null,
      ninOrRegNo: user.ninOrRegNo ?? null,
      city: user.city ?? null,
      verificationRiskScore: user.verificationRiskScore ?? null,
      verificationDocumentStatus: user.verificationDocumentStatus ?? null,
      rejectionReason: user.rejectionReason ?? null,
      verifiedAt: user.verifiedAt ?? null,
    };
  }

  private canonicalizePhone(phone: string): string {
    if (!phone) return phone;
    try {
      return normalizeE164(phone).e164;
    } catch {
      return phone.trim();
    }
  }

  private generateOtpCode(): string {
    const length = this.config.otp.length;
    let code = '';
    for (let i = 0; i < length; i++) {
      code += randomInt(0, 10).toString();
    }
    return code;
  }
}
