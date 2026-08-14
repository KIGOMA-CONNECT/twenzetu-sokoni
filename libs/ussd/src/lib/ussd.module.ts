import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UssdController } from './ussd.controller';
import { UssdSessionService } from './ussd-session.service';
import { UssdSessionCleanupService } from './ussd-session-cleanup.service';
import { UssdEngine } from './ussd.engine';
import { BeemUssdAdapter } from './adapters/beem.adapter';
import { UssdSessionEntity } from './entities/ussd-session.entity';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';

@Module({
  imports: [
    TypeOrmModule.forFeature([UssdSessionEntity, UserOrmEntity]),
  ],
  controllers: [UssdController],
  providers: [UssdSessionService, UssdSessionCleanupService, UssdEngine, BeemUssdAdapter],
  exports: [UssdSessionService, UssdEngine, BeemUssdAdapter],
})
export class UssdModule {}
