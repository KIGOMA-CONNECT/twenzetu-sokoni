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

  /**
   * Atomically consumes a valid, unused OTP. Only the first concurrent caller
   * receives a row, preventing the same code from being used twice.
   */
  public async consume(phoneNumber: string, code: string): Promise<OtpOrmEntity | null> {
    const results = await this.repo.query(
      `UPDATE otps SET is_used = true, updated_at = NOW()
       WHERE id = (
         SELECT id FROM otps
         WHERE phone_number = $1 AND code = $2 AND is_used = false AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1
       )
       RETURNING id, phone_number AS "phoneNumber", code, expires_at AS "expiresAt", is_used AS "isUsed", tenant_id AS "tenantId", created_at AS "createdAt"`,
      [phoneNumber, code],
    );
    return results.length > 0 ? (results[0] as OtpOrmEntity) : null;
  }

  public async markUsed(id: string): Promise<void> {
    await this.repo.update(id, { isUsed: true });
  }

  public async invalidateAll(phoneNumber: string): Promise<void> {
    await this.repo.update({ phoneNumber, isUsed: false }, { isUsed: true });
  }
}
