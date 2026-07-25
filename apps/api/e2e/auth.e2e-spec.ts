import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '@afri-market/identity-api';
import { AuthService } from '@afri-market/identity-api';
import { AuthGuard } from '@nestjs/passport';

describe('Auth E2E', () => {
  let app: INestApplication;
  let authService: Record<string, jest.Mock>;

  beforeAll(async () => {
    authService = {
      registerTenant: jest.fn().mockResolvedValue({ tenantId: 't-123' }),
      registerUser: jest.fn().mockResolvedValue({ userId: 'u-456' }),
      login: jest.fn().mockResolvedValue({
        accessToken: 'mock-jwt-token',
        user: { id: 'u-456', phoneNumber: '+250788100001', fullName: 'Test', role: 'customer', status: 'ACTIVE' },
      }),
      getProfile: jest.fn().mockResolvedValue({
        id: 'u-456', phoneNumber: '+250788100001', fullName: 'Test User', role: 'customer', status: 'ACTIVE', email: null,
      }),
      updateProfile: jest.fn().mockResolvedValue({
        id: 'u-456', phoneNumber: '+250788100001', fullName: 'Updated', role: 'customer', status: 'ACTIVE', email: null,
      }),
      sendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent to +250788100001' }),
      verifyOtp: jest.fn().mockResolvedValue({ verified: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (ctx: ExecutionContext) => {
        ctx.switchToHttp().getRequest().user = { sub: 'u-456', tenantId: 't-123', role: 'customer', phoneNumber: '+250788100001' };
        return true;
      } })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register-tenant', () => {
    it('should register a new tenant', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register-tenant')
        .send({ name: 'Kigali Hub' })
        .expect(201);
      expect(res.body.tenantId).toBe('t-123');
      expect(authService.registerTenant).toHaveBeenCalledWith('Kigali Hub');
    });

    it('should reject empty name', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register-tenant')
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          tenantId: 't-123',
          phoneNumber: '+250788100099',
          fullName: 'New User',
          role: 'customer',
          password: 'secret123',
        })
        .expect(201);
      expect(res.body.userId).toBe('u-456');
      expect(authService.registerUser).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return JWT token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phoneNumber: '+250788100001', password: 'password123' })
        .expect(201);
      expect(res.body.accessToken).toBe('mock-jwt-token');
      expect(res.body.user.id).toBe('u-456');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(200);
      expect(res.body.fullName).toBe('Test User');
      expect(authService.getProfile).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('should update profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/auth/me')
        .send({ fullName: 'Updated Name' })
        .expect(200);
      expect(res.body.fullName).toBe('Updated');
    });
  });

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '+250788100001' })
        .expect(201);
      expect(res.body.message).toContain('OTP sent');
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+250788100001', code: '123456' })
        .expect(201);
      expect(res.body.verified).toBe(true);
    });
  });
});
