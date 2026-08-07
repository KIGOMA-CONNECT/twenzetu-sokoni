import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, JwtPayload, Roles, RolesGuard, SessionMetadata } from '@afri-market/identity-infrastructure';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-tenant')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new tenant (merchant/city)' })
  @ApiBody({ type: RegisterTenantDto })
  @ApiResponse({ status: 201, description: 'Tenant registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto.name);
  }

  @Get('default-tenant')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Resolve the default marketplace tenant for public registration' })
  @ApiResponse({ status: 200, description: 'Default tenant resolved' })
  @ApiResponse({ status: 404, description: 'No active tenant configured' })
  public async getDefaultTenant() {
    return this.authService.getDefaultTenant();
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user within a tenant' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async register(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(
      dto.tenantId,
      dto.phoneNumber,
      dto.fullName,
      dto.role,
      dto.password,
      dto.email,
      { businessName: dto.businessName, ninOrRegNo: dto.ninOrRegNo, city: dto.city },
    );
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with phone number and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto.phoneNumber, dto.password, this.extractMetadata(req));
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile (fullName, email)' })
  @ApiBody({ schema: { properties: { fullName: { type: 'string' }, email: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { fullName?: string; email?: string },
  ) {
    return this.authService.updateProfile(user.sub, body);
  }

  @Post('send-otp')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Send OTP to phone number (SMS routed per country)' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 201, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phoneNumber);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP code and receive tokens (OTP login)' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 201, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.authService.verifyOtp(dto.phoneNumber, dto.code, this.extractMetadata(req));
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token pair' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 201, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  public async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, this.extractMetadata(req));
  }

  @Post('logout')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Revoke the current refresh token (log out)' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 201, description: 'Logged out' })
  public async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('admin/users/:id/suspend')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Suspend a user and force-logout all their sessions' })
  @ApiResponse({ status: 201, description: 'User suspended and sessions revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.authService.suspend(id, caller.tenantId);
  }

  @Post('admin/users/:id/unsuspend')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Re-activate a suspended user' })
  @ApiResponse({ status: 201, description: 'User re-activated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async unsuspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.authService.unsuspend(id, caller.tenantId);
  }

  @Get('admin/verifications')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List vendors/drivers awaiting verification approval' })
  @ApiResponse({ status: 200, description: 'Pending verifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async listPendingVerifications(@CurrentUser() caller: JwtPayload) {
    return this.authService.listPendingVerifications(caller.tenantId);
  }

  @Post('admin/verifications/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Approve a vendor/driver verification' })
  @ApiResponse({ status: 201, description: 'Verification approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async approveVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.authService.approveVerification(id, caller.tenantId);
  }

  @Post('admin/verifications/:id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Reject a vendor/driver verification' })
  @ApiResponse({ status: 201, description: 'Verification rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async rejectVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: JwtPayload,
    @Body() body: { reason: string },
  ) {
    return this.authService.rejectVerification(id, caller.tenantId, body.reason);
  }

  private extractMetadata(req: Request): SessionMetadata {
    const userAgent = req.headers['user-agent'];
    const deviceName = (req.headers['x-device-name'] as string) ?? undefined;
    return {
      deviceName: deviceName ?? (userAgent ? userAgent.substring(0, 80) : undefined),
      ipAddress: req.ip || req.socket?.remoteAddress || undefined,
      userAgent: userAgent || undefined,
    };
  }
}
