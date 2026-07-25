import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { TypeOrmTenantRepository } from './repositories/typeorm-tenant.repository';
import { TypeOrmOtpRepository } from './repositories/typeorm-otp.repository';

export const IDENTITY_REPOSITORIES = [TypeOrmUserRepository, TypeOrmTenantRepository, TypeOrmOtpRepository];
