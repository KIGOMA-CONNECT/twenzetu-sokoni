import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldMetadataOrmEntity } from './entities/field-metadata-orm.entity';
import { FormMetadataOrmEntity } from './entities/form-metadata-orm.entity';
import { EntityPermissionOrmEntity } from './entities/entity-permission-orm.entity';

export const METADATA_ENTITIES = [
  FieldMetadataOrmEntity,
  FormMetadataOrmEntity,
  EntityPermissionOrmEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(METADATA_ENTITIES)],
  exports: [TypeOrmModule],
})
export class MetadataInfrastructureModule {}
