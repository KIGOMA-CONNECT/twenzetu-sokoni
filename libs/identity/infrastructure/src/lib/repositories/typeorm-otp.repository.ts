import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { OtpOrmEntity } from '../entities/otp-orm.entity';

@Injectable()
export class TypeOrmOtpRepository {
  constructor(
    @InjectRepository(OtpOrmEntity)
    private readonly repo: Repository<OtpOrmEntity>,
  ) {}

  public async create(phoneNumber: string, code: string, expiresAt: Date, tenantId?: string): Promise<OtpOrmEntity> {
    const otp = this.repo.create({ phoneNumber, code, expiresAt, isUsed: false, tenantId: tenantId ?? null });
    return this.repo.save(otp);
  }

  public async findValid(phoneNumber: string, code: string): Promise<OtpOrmEntity | null> {
    return this.repo.findOne({
      where: {
        phoneNumber,
        code,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  public async markUsed(id: string): Promise<void> {
    await this.repo.update(id, { isUsed: true });
  }

  public async invalidateAll(phoneNumber: string): Promise<void> {
    await this.repo.update({ phoneNumber, isUsed: false }, { isUsed: true });
  }
}
