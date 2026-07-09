import { AppConfigModule, AppConfigService } from '@abms/core-config';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { buildDataSourceOptions } from './config/build-data-source-options';

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
      exports: [TypeOrmModule],
    };
  }
}
