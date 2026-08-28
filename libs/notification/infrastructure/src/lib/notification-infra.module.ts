import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationOrmEntity } from './entities/notification-orm.entity';
import { NotificationTemplateOrmEntity } from './entities/notification-template-orm.entity';

export const NOTIFICATION_ENTITIES = [NotificationOrmEntity, NotificationTemplateOrmEntity];

@Module({
  imports: [TypeOrmModule.forFeature(NOTIFICATION_ENTITIES)],
  exports: [TypeOrmModule],
})
export class NotificationInfraModule {}
