import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantAwareUnitOfWork } from './unit-of-work/tenant-aware-unit-of-work';
import { GlobalUnitOfWork } from './unit-of-work/global-unit-of-work';

@Module({})
export class DatabaseModule {
  public static forRoot(entities: (abstract new (...args: unknown[]) => object)[]): DynamicModule {
    // Resolve DB username in a robust order so CI and different libraries pick up
    // the intended runtime user instead of falling back to an unsafe default.
    const dbUser:
      | string
      | undefined =
      process.env.DB_RUNTIME_USER ??
      process.env.DB_USER ??
      process.env.DB_USERNAME ??
      process.env.DATABASE_USER ??
      process.env.DATABASE_USERNAME ??
      process.env.PGUSER ??
      (() => {
        const url = process.env.DATABASE_URL;
        if (!url) return 'postgres';
        try {
          return new URL(url).username || 'postgres';
        } catch {
          return 'postgres';
        }
      })();

    const dbPassword:
      | string
      | undefined =
      process.env.DB_RUNTIME_PASSWORD ??
      process.env.DB_PASSWORD ??
      process.env.DATABASE_PASSWORD ??
      process.env.PGPASSWORD ??
      (() => {
        const url = process.env.DATABASE_URL;
        if (!url) return 'postgres';
        try {
          return new URL(url).password || 'postgres';
        } catch {
          return 'postgres';
        }
      })();

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env['DB_HOST'] || 'localhost',
          port: parseInt(process.env['DB_PORT'] || '5432', 10),
          username: dbUser,
          password: dbPassword,
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
