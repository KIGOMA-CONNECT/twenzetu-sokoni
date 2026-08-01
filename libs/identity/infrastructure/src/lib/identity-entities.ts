import { UserOrmEntity } from './entities/user-orm.entity';
import { TenantOrmEntity } from './entities/tenant-orm.entity';
import { OtpOrmEntity } from './entities/otp-orm.entity';
import { SessionOrmEntity } from './entities/session-orm.entity';

export const IDENTITY_ENTITIES = [UserOrmEntity, TenantOrmEntity, OtpOrmEntity, SessionOrmEntity];
