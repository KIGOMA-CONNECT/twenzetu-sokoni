import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisteredEntityOrmEntity } from './entities/registered-entity-orm.entity';
import { EntityRelationshipOrmEntity } from './entities/entity-relationship-orm.entity';
import { TypeOrmRegisteredEntityRepository } from './repositories/typeorm-registered-entity.repository';
import { TypeOrmEntityRelationshipRepository } from './repositories/typeorm-entity-relationship.repository';

export const UBR_ENTITIES = [RegisteredEntityOrmEntity, EntityRelationshipOrmEntity];

export const UBR_REPOSITORIES = [
  {
    provide: 'IRegisteredEntityRepository',
    useClass: TypeOrmRegisteredEntityRepository,
  },
  {
    provide: 'IEntityRelationshipRepository',
    useClass: TypeOrmEntityRelationshipRepository,
  },
];

@Module({
  imports: [TypeOrmModule.forFeature(UBR_ENTITIES)],
  providers: [...UBR_REPOSITORIES],
  exports: [...UBR_REPOSITORIES],
})
export class UbrInfrastructureModule {}
