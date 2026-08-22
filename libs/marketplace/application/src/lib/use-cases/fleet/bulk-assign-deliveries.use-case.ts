import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AssignDriverUseCase } from '../delivery/assign-driver.use-case';

export interface BulkAssignItemResult {
  orderId: string;
  success: boolean;
  driverId?: string;
  deliveryId?: string;
  error?: string;
}

export interface BulkAssignDeliveriesResult {
  assigned: number;
  failed: number;
  results: BulkAssignItemResult[];
}

const MAX_BATCH = 100;

// Assigns a batch of queued orders to available drivers. Each order goes to
// the eligible driver with the fewest active deliveries (least-loaded), which
// spreads work evenly across the fleet instead of dumping everything on the
// first driver. Individual assignment failures do not abort the batch.
@Injectable()
export class BulkAssignDeliveriesUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly assignDriver: AssignDriverUseCase,
  ) {}

  public async execute(
    tenantId: string,
    orderIds: string[],
    driverIds?: string[],
  ): Promise<BulkAssignDeliveriesResult> {
    const orders = [...new Set(orderIds)].slice(0, MAX_BATCH);
    if (orders.length === 0) {
      throw new BadRequestException('At least one orderId is required');
    }

    const pool = await this.availableDrivers(tenantId, driverIds);
    if (pool.length === 0) {
      throw new BadRequestException('No available drivers in the fleet');
    }

    const load = await this.activeLoad(tenantId, pool);
    const lastAssigned = new Map<string, number>();
    const results: BulkAssignItemResult[] = [];

    for (const orderId of orders) {
      // Re-rank after every assignment so a driver who just took an order
      // moves to the back of the queue for the next one. Ties on load are
      // broken by least-recently-assigned for an even round-robin spread.
      pool.sort((a, b) => {
        const byLoad = (load.get(a) ?? 0) - (load.get(b) ?? 0);
        if (byLoad !== 0) return byLoad;
        return (lastAssigned.get(a) ?? -1) - (lastAssigned.get(b) ?? -1);
      });
      const driverId = pool[0];
      try {
        const result = await this.assignDriver.execute(tenantId, orderId, driverId);
        load.set(driverId, (load.get(driverId) ?? 0) + 1);
        lastAssigned.set(driverId, results.length);
        results.push({ orderId, success: true, driverId, deliveryId: result.deliveryId });
      } catch (err) {
        results.push({ orderId, success: false, error: (err as Error).message });
      }
    }

    return {
      assigned: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  private async availableDrivers(tenantId: string, driverIds?: string[]): Promise<string[]> {
    const params: unknown[] = [tenantId];
    let extra = '';
    if (driverIds && driverIds.length > 0) {
      params.push(driverIds.slice(0, MAX_BATCH));
      extra = `AND u.id = ANY($${params.length})`;
    }
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT DISTINCT u.id
         FROM users u
         JOIN vehicles v ON v.driver_id = u.id AND v.tenant_id = u.tenant_id
        WHERE u.tenant_id = $1
          AND u.role = 'driver'
          AND u.status = 'ACTIVE'
          AND v.is_available = TRUE
          ${extra}`,
      params,
    );
    return rows.map((r) => r.id);
  }

  private async activeLoad(tenantId: string, driverIds: string[]): Promise<Map<string, number>> {
    const load = new Map<string, number>(driverIds.map((id) => [id, 0]));
    if (driverIds.length === 0) return load;
    const rows: Array<{ driver_id: string; active: string }> = await this.dataSource.query(
      `SELECT d.driver_id, COUNT(*) AS active
         FROM deliveries d
        WHERE d.tenant_id = $1
          AND d.driver_id = ANY($2)
          AND d.status IN ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
        GROUP BY d.driver_id`,
      [tenantId, driverIds],
    );
    for (const row of rows) {
      load.set(row.driver_id, Number(row.active));
    }
    return load;
  }
}
