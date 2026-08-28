import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { METADATA_ENTITIES, MetadataInfrastructureModule } from '@abms/metadata-infrastructure';
import { MetadataEngineService } from './metadata-engine.service';
import { MetadataController } from './metadata.controller';
import { FieldMetadataOrmEntity } from '@abms/metadata-infrastructure';
import { FormMetadataOrmEntity } from '@abms/metadata-infrastructure';
import { EntityPermissionOrmEntity } from '@abms/metadata-infrastructure';

@Module({
  imports: [
    TypeOrmModule.forFeature(METADATA_ENTITIES),
    MetadataInfrastructureModule,
  ],
  controllers: [MetadataController],
  providers: [
    MetadataEngineService,
  ],
  exports: [MetadataEngineService],
})
export class MetadataModule {}
