import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigOrmEntity } from './entities/system-config-orm.entity';
import { TenantConfigOrmEntity } from './entities/tenant-config-orm.entity';
import { FeatureFlagOrmEntity } from './entities/feature-flag-orm.entity';

export const CONFIG_ENTITIES = [SystemConfigOrmEntity, TenantConfigOrmEntity, FeatureFlagOrmEntity];

@Module({
  imports: [TypeOrmModule.forFeature(CONFIG_ENTITIES)],
  exports: [TypeOrmModule],
})
export class ConfigurationInfraModule {}
