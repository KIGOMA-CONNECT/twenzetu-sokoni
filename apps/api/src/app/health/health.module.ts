import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule,
    CacheModule.register(),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
