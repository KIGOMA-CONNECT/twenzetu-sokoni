import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';
import { MarketplaceApplicationModule, ADMIN_USER_REPOSITORY } from '@afri-market/marketplace-application';
import { TypeOrmAdminUserRepository } from '@afri-market/marketplace-infrastructure';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    MarketplaceApplicationModule,
  ],
  controllers: [AdminController],
  providers: [
    { provide: ADMIN_USER_REPOSITORY, useClass: TypeOrmAdminUserRepository },
  ],
})
export class AdminModule {}
