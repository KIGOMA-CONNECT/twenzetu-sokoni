import { ExecutionContext } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

export function createMockUseCase(methods: Record<string, jest.Mock> = {}) {
  const mock: Record<string, jest.Mock> = {};
  for (const [key, fn] of Object.entries(methods)) {
    mock[key] = fn;
  }
  return mock;
}

export async function createTestApp(moduleDef: TestingModule): Promise<INestApplication> {
  const app = moduleDef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

export const MOCK_JWT_PAYLOAD = {
  sub: 'b0000000-0000-0000-0000-000000000003',
  tenantId: 'a0000000-0000-0000-0000-000000000001',
  role: 'customer',
  phoneNumber: '+250788100003',
  sid: 'c0000000-0000-0000-0000-000000000003',
  tokenType: 'access',
};

export const MOCK_ADMIN_JWT_PAYLOAD = {
  sub: 'b0000000-0000-0000-0000-000000000001',
  tenantId: 'a0000000-0000-0000-0000-000000000001',
  role: 'admin',
  phoneNumber: '+250788100001',
  sid: 'c0000000-0000-0000-0000-000000000001',
  tokenType: 'access',
};

export const MOCK_VENDOR_JWT_PAYLOAD = {
  sub: 'b0000000-0000-0000-0000-000000000002',
  tenantId: 'a0000000-0000-0000-0000-000000000001',
  role: 'vendor',
  phoneNumber: '+250788100002',
  sid: 'c0000000-0000-0000-0000-000000000002',
  tokenType: 'access',
};

export const MOCK_DRIVER_JWT_PAYLOAD = {
  sub: 'b0000000-0000-0000-0000-000000000004',
  tenantId: 'a0000000-0000-0000-0000-000000000001',
  role: 'driver',
  phoneNumber: '+250788100004',
  sid: 'c0000000-0000-0000-0000-000000000004',
  tokenType: 'access',
};

export class MockAuthGuard {
  static create(payload = MOCK_JWT_PAYLOAD) {
    return {
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = payload;
        return true;
      },
    };
  }
}
