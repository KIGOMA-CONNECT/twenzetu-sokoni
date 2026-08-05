import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantAwareUnitOfWork } from './unit-of-work/tenant-aware-unit-of-work';
import { GlobalUnitOfWork } from './unit-of-work/global-unit-of-work';

@Module({})
export class DatabaseModule {
  public static forRoot(entities: (abstract new (...args: unknown[]) => object)[]): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env['DB_HOST'] || 'localhost',
          port: parseInt(process.env['DB_PORT'] || '5432', 10),
          username: process.env['DB_RUNTIME_USER'] || 'afri_runtime',
          password: process.env['DB_RUNTIME_PASSWORD'] || 'afri_runtime_dev_password',
          database: process.env['DB_NAME'] || 'afri_market',
          entities,
          synchronize: false,
          logging: process.env['APP_ENV'] === 'development',
        }),
      ],
      providers: [
        GlobalUnitOfWork,
        TenantAwareUnitOfWork,
      ],
      exports: [TypeOrmModule, GlobalUnitOfWork, TenantAwareUnitOfWork],
    };
  }
}
