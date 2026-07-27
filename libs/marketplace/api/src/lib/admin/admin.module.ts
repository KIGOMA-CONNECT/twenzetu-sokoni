import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceApplicationModule } from '@afri-market/marketplace-application';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';
import { AuditLogOrmEntity } from '@afri-market/marketplace-infrastructure';
import { AdminController } from './admin.controller';
import { AdminUsersController } from './admin-users.controller';
import { AuditLogService } from '../audit-log.service';

@Module({
  imports: [
    MarketplaceApplicationModule,
    TypeOrmModule.forFeature([UserOrmEntity, AuditLogOrmEntity]),
  ],
  controllers: [AdminController, AdminUsersController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AdminModule {}
