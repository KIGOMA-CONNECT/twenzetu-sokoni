import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAdminUserRepository } from '@afri-market/marketplace-domain';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';

@Injectable()
export class TypeOrmAdminUserRepository implements IAdminUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
  ) {}

  public async countByTenant(tenantId: string): Promise<number> {
    return this.userRepo.count({ where: { tenantId } });
  }
}
