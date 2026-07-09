import { AppConfigModule, AppConfigService } from '@abms/core-config';
import { TenancyModule } from '@abms/tenancy';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { buildDataSourceOptions } from './config/build-data-source-options';
import { TenantAwareUnitOfWork } from './unit-of-work/tenant-aware-unit-of-work';

@Module({})
export class DatabaseModule {
  // entities is supplied by the composition root (apps/api), which aggregates every
  // module's entity classes; this library stays ignorant of any specific module.
  public static forRoot(entities: DataSourceOptions['entities'] = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        AppConfigModule,
        TenancyModule,
        TypeOrmModule.forRootAsync({
          imports: [AppConfigModule],
          inject: [AppConfigService],
          useFactory: (config: AppConfigService) =>
            buildDataSourceOptions(
              config.database,
              { username: config.database.runtimeUser, password: config.database.runtimePassword },
              { entities },
            ),
        }),
      ],
      providers: [TenantAwareUnitOfWork],
      exports: [TypeOrmModule, TenantAwareUnitOfWork],
    };
  }
}
