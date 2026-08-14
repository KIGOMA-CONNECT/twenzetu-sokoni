import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UssdController } from './ussd.controller';
import { UssdSessionService } from './ussd-session.service';
import { UssdSessionCleanupService } from './ussd-session-cleanup.service';
import { UssdEngine } from './ussd.engine';
import { UssdSessionEntity } from './entities/ussd-session.entity';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';

@Module({
  imports: [
    TypeOrmModule.forFeature([UssdSessionEntity, UserOrmEntity]),
  ],
  controllers: [UssdController],
  providers: [UssdSessionService, UssdSessionCleanupService, UssdEngine],
  exports: [UssdSessionService, UssdEngine],
})
export class UssdModule {}
