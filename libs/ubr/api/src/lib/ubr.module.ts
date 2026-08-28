import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UBR_ENTITIES,
  UBR_REPOSITORIES,
  UbrInfrastructureModule,
  RegisteredEntityOrmEntity,
  EntityRelationshipOrmEntity,
  TypeOrmRegisteredEntityRepository,
  TypeOrmEntityRelationshipRepository,
} from '@abms/ubr-infrastructure';
import { FieldMetadataOrmEntity, FormMetadataOrmEntity, EntityPermissionOrmEntity } from '@abms/metadata-infrastructure';
import { OntologyService } from './ontology.service';
import { OntologyController } from './ontology.controller';
import { OntologySeedService } from './ontology-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ...UBR_ENTITIES,
      FieldMetadataOrmEntity,
      FormMetadataOrmEntity,
      EntityPermissionOrmEntity,
    ]),
    UbrInfrastructureModule,
  ],
  controllers: [OntologyController],
  providers: [
    {
      provide: 'IRegisteredEntityRepository',
      useClass: TypeOrmRegisteredEntityRepository,
    },
    {
      provide: 'IEntityRelationshipRepository',
      useClass: TypeOrmEntityRelationshipRepository,
    },
    OntologyService,
    OntologySeedService,
  ],
  exports: [OntologyService, OntologySeedService],
})
export class UbrModule {}
