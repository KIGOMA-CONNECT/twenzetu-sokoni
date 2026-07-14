import { AppConfigModule, AppConfigService } from '@abms/core-config';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { buildDataSourceOptions } from './config/build-data-source-options';
import { GlobalUnitOfWork } from './unit-of-work/global-unit-of-work';
import { TenantAwareUnitOfWork } from './unit-of-work/tenant-aware-unit-of-work';

// Global, matching AppConfigModule/AppLoggerModule/TenancyModule: every future
// business module needs DB access, so none should have to re-import this.
//
// Deliberately does NOT import TenancyModule: TenancyModule.forRoot() is registered
// once by the composition root (apps/api). Importing it here too would create a
// second, competing @Global() registration of AsyncLocalTenantContextStore — two
// live instances of the same AsyncLocalStorage wrapper, causing TenantAwareUnitOfWork
// to silently read from the wrong one. TenantAwareUnitOfWork only needs
// AsyncLocalTenantContextStore to already be global from wherever the composition
// root registers it — see ADR-0005.
@Global()
@Module({})
export class DatabaseModule {
  // entities is supplied by the composition root (apps/api), which aggregates every
  // module's entity classes; this library stays ignorant of any specific module.
  public static forRoot(entities: DataSourceOptions['entities'] = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        AppConfigModule,
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
      providers: [TenantAwareUnitOfWork, GlobalUnitOfWork],
      exports: [TypeOrmModule, TenantAwareUnitOfWork, GlobalUnitOfWork],
    };
  }
}
