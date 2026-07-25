import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-tenant')
  @Throttle({ auth: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new tenant (merchant/city)' })
  @ApiBody({ type: RegisterTenantDto })
  @ApiResponse({ status: 201, description: 'Tenant registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto.name);
  }

  @Post('register')
  @Throttle({ auth: { limit: 3, ttl: 60000 } })
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
    );
  }

  @Post('login')
  @Throttle({ auth: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with phone number and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.phoneNumber, dto.password);
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
  @Throttle({ auth: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 201, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phoneNumber);
  }

  @Post('verify-otp')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 201, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  public async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phoneNumber, dto.code);
  }
}
