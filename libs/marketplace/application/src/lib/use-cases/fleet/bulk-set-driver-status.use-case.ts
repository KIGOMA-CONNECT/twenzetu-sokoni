import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EntityId } from '@afri-market/kernel';
import { USER_REPOSITORY } from '../../tokens';
import { IUserRepository } from '@afri-market/identity-domain';
import { BulkDriverOpResult } from './bulk-verify-drivers.use-case';

export interface BulkSetDriverStatusResult {
  updated: number;
  failed: number;
  results: BulkDriverOpResult[];
}

const ALLOWED_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
const MAX_BATCH = 200;

// Bulk activates or suspends driver accounts. Suspended drivers keep their
// vehicles but can no longer receive dispatches (fleet list filters by status).
@Injectable()
export class BulkSetDriverStatusUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  public async execute(tenantId: string, driverIds: string[], status: string): Promise<BulkSetDriverStatusResult> {
    if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      throw new BadRequestException(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }
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
          `UPDATE users SET status = $1, updated_at = NOW()
           WHERE id = $2 AND tenant_id = $3 AND role = 'driver'`,
          [status, driverId, tenantId],
        );
        if (status === 'SUSPENDED') {
          // Take suspended drivers off the road immediately.
          await this.dataSource.query(
            `UPDATE vehicles SET is_available = FALSE, is_online = FALSE, updated_at = NOW()
             WHERE driver_id = $1 AND tenant_id = $2`,
            [driverId, tenantId],
          );
        }
        results.push({ driverId, success: true });
      } catch (err) {
        results.push({ driverId, success: false, error: (err as Error).message });
      }
    }

    return {
      updated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
