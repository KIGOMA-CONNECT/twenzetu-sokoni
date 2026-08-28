import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONFIG_ENTITIES, ConfigurationInfraModule } from '@abms/configuration-infrastructure';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(CONFIG_ENTITIES),
    ConfigurationInfraModule,
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
