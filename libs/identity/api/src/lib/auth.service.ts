import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityId, TenantId, PhoneNumber, Email } from '@afri-market/kernel';
import { User, Tenant, UserRole } from '@afri-market/identity-domain';
import { IUserRepository } from '@afri-market/identity-domain';
import { ITenantRepository } from '@afri-market/identity-domain';
import { AppConfigService } from '@afri-market/core-config';
import { IPasswordHasher } from '@afri-market/identity-infrastructure';
import { TypeOrmOtpRepository } from '@afri-market/identity-infrastructure';
import { SmsService, EmailService } from '@afri-market/integrations';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tenantRepo: ITenantRepository,
    private readonly otpRepo: TypeOrmOtpRepository,
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
    await this.userRepo.save(user);
    this.emailService.sendWelcome(email ?? '', fullName).catch(() => {});
    return { userId: user.id.value };
  }

  public async login(phoneNumber: string, password: string): Promise<{ accessToken: string; user: Record<string, unknown> }> {
    const user = await this.userRepo.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.hasher.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: user.id.value,
      tenantId: user.tenantId.value,
      role: user.role,
      phoneNumber: user.phoneNumber.value,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id.value,
        phoneNumber: user.phoneNumber.value,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    };
  }

  public async getProfile(userId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepo.findById(EntityId.from(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id.value,
      phoneNumber: user.phoneNumber.value,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      email: user.email?.value ?? null,
    };
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

  public async verifyOtp(phoneNumber: string, code: string): Promise<{ verified: boolean }> {
    const otp = await this.otpRepo.findValid(phoneNumber, code);
    if (!otp) {
      return { verified: false };
    }
    await this.otpRepo.markUsed(otp.id);
    return { verified: true };
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
