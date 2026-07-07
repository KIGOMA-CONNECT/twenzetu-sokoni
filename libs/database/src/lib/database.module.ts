import { AppConfigModule, AppConfigService } from '@abms/core-config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './config/build-data-source-options';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        buildDataSourceOptions(config.database, {
          username: config.database.runtimeUser,
          password: config.database.runtimePassword,
        }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
