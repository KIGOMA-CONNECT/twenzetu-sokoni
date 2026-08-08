import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './audit-log.entity';
import { AuditService } from './audit.service';
import { QueueModule } from '@afri-market/core-queue';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity]),
    QueueModule,
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
