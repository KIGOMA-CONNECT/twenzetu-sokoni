import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminUsersController } from '@afri-market/marketplace-api';
import { UserOrmEntity, RolesGuard, PermissionsGuard } from '@afri-market/identity-infrastructure';

describe('Admin Users E2E', () => {
  let app: INestApplication;
  const mockUserRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        { provide: getRepositoryToken(UserOrmEntity), useValue: mockUserRepo },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (ctx: ExecutionContext) => {
        ctx.switchToHttp().getRequest().user = {
          sub: 'b0000000-0000-0000-0000-000000000009',
          tenantId: 'a0000000-0000-0000-0000-000000000002',
          role: 'super_admin',
          phoneNumber: '+255754100000',
          permissions: '',
        };
        return true;
      } })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should list admin users', async () => {
      mockUserRepo.find.mockResolvedValue([
        { id: 'b0000000-0000-0000-0000-000000000011', fullName: 'Super Admin', phoneNumber: '+255754100000', role: 'super_admin', status: 'ACTIVE', email: null, permissions: null, createdAt: new Date() },
        { id: 'b0000000-0000-0000-0000-000000000010', fullName: 'Admin User', phoneNumber: '+255754100001', role: 'admin', status: 'ACTIVE', email: null, permissions: 'manage_vendors,manage_disputes', createdAt: new Date() },
      ]);

      const res = await request(app.getHttpServer()).get('/api/admin/users').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].role).toBe('super_admin');
      expect(res.body[1].role).toBe('admin');
      expect(res.body[1].permissions).toEqual(['manage_vendors', 'manage_disputes']);
    });

    it('should filter non-admin roles', async () => {
      mockUserRepo.find.mockResolvedValue([
        { id: 'b0000000-0000-0000-0000-000000000012', fullName: 'A Vendor', phoneNumber: '+255754100002', role: 'vendor', status: 'ACTIVE', email: null, permissions: null, createdAt: new Date() },
      ]);

      const res = await request(app.getHttpServer()).get('/api/admin/users').expect(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create admin user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({});
      mockUserRepo.save.mockResolvedValue({ id: 'new-uuid' });

      const res = await request(app.getHttpServer())
        .post('/api/admin/users')
        .send({ phoneNumber: '+255754100099', fullName: 'New Admin', password: 'password123', role: 'admin' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.userId).toBe('new-uuid');
    });

    it('should reject duplicate phone number', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing', phoneNumber: '+255754100099' });

      const res = await request(app.getHttpServer())
        .post('/api/admin/users')
        .send({ phoneNumber: '+255754100099', fullName: 'Duplicate', password: 'password123', role: 'admin' })
        .expect(201);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Phone number already registered');
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('should change user role', async () => {
      mockUserRepo.update.mockResolvedValue({ affected: 1 });

      const res = await request(app.getHttpServer())
        .patch('/api/admin/users/b0000000-0000-0000-0000-000000000010/role')
        .send({ role: 'super_admin' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(mockUserRepo.update).toHaveBeenCalledWith('b0000000-0000-0000-0000-000000000010', { role: 'super_admin' });
    });

    it('should reject changing own role', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/users/b0000000-0000-0000-0000-000000000009/role')
        .send({ role: 'admin' })
        .expect(200);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot change your own role');
    });
  });

  describe('PATCH /api/admin/users/:id/permissions', () => {
    it('should update admin permissions', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'b0000000-0000-0000-0000-000000000010', role: 'admin', permissions: '' });

      const res = await request(app.getHttpServer())
        .patch('/api/admin/users/b0000000-0000-0000-0000-000000000010/permissions')
        .send({ permissions: ['manage_vendors', 'view_analytics'] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should reject updating super_admin permissions', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'b0000000-0000-0000-0000-000000000011', role: 'super_admin' });

      const res = await request(app.getHttpServer())
        .patch('/api/admin/users/b0000000-0000-0000-0000-000000000011/permissions')
        .send({ permissions: ['manage_vendors'] })
        .expect(200);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Super admins have all permissions');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete admin user', async () => {
      mockUserRepo.delete.mockResolvedValue({ affected: 1 });

      const res = await request(app.getHttpServer())
        .delete('/api/admin/users/b0000000-0000-0000-0000-000000000010')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject self-deletion', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/admin/users/b0000000-0000-0000-0000-000000000009')
        .expect(200);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot delete your own account');
    });
  });
});

