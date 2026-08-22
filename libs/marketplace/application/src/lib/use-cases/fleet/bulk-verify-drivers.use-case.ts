import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EntityId } from '@afri-market/kernel';
import { USER_REPOSITORY } from '../../tokens';
import { IUserRepository } from '@afri-market/identity-domain';

export interface BulkDriverOpResult {
  driverId: string;
  success: boolean;
  error?: string;
}

export interface BulkVerifyDriversResult {
  verified: number;
  failed: number;
  results: BulkDriverOpResult[];
}

const MAX_BATCH = 200;

// Verifies a batch of drivers in one operation: activates the user account and
// stamps `verified_at` on all of the driver's vehicles. Individual failures are
// captured per-driver so one bad id does not abort the whole batch.
@Injectable()
export class BulkVerifyDriversUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  public async execute(tenantId: string, driverIds: string[]): Promise<BulkVerifyDriversResult> {
    const ids = [...new Set(driverIds)].slice(0, MAX_BATCH);
    const results: BulkDriverOpResult[] = [];

    for (const driverId of ids) {
      try {
        const driver = await this.userRepo.findById(EntityId.from(driverId));
        if (!driver || driver.role !== 'driver' || driver.tenantId.value !== tenantId) {
          results.push({ driverId, success: false, error: 'Driver not found' });
          continue;
        }
        await this.dataSource.query(
          `UPDATE users SET status = 'ACTIVE', updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2 AND role = 'driver'`,
          [driverId, tenantId],
        );
        await this.dataSource.query(
          `UPDATE vehicles SET verified_at = NOW(), updated_at = NOW()
           WHERE driver_id = $1 AND tenant_id = $2`,
          [driverId, tenantId],
        );
        results.push({ driverId, success: true });
      } catch (err) {
        results.push({ driverId, success: false, error: (err as Error).message });
      }
    }

    return {
      verified: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
