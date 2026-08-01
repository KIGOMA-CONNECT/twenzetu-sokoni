import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { TypeOrmTenantRepository } from './repositories/typeorm-tenant.repository';
import { TypeOrmOtpRepository } from './repositories/typeorm-otp.repository';
import { TypeOrmSessionRepository } from './repositories/typeorm-session.repository';

export const USER_REPOSITORY = 'IUserRepository';
export const TENANT_REPOSITORY = 'ITenantRepository';

export const IDENTITY_REPOSITORIES = [
  { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
  { provide: TENANT_REPOSITORY, useClass: TypeOrmTenantRepository },
  TypeOrmOtpRepository,
  TypeOrmSessionRepository,
];
