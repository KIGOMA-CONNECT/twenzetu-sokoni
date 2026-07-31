import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { NotificationsService, MarketplaceGateway } from '@afri-market/marketplace-api';

interface DispatchCandidate {
  id: string;
  tenantId: string;
  customerId: string;
  vendorId: string;
  status: string;
  deliveryAddress: string;
  deliveryLatitude: string | null;
  deliveryLongitude: string | null;
  deliveryFee: string;
  totalAmount: string;
  vendorName: string;
}

interface AvailableDriver {
  driverId: string;
  vehicleType: string;
  plateNumber: string;
}

@Injectable()
export class AutoDispatchService {
  private readonly logger = new Logger(AutoDispatchService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notifService: NotificationsService,
    private readonly gateway: MarketplaceGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDispatch(): Promise<void> {
    try {
      const candidates = await this.findCandidates();
      if (candidates.length === 0) {
        return;
      }
      this.logger.log(`Auto-dispatch: found ${candidates.length} order(s) eligible for dispatch`);

      for (const order of candidates) {
        await this.dispatchOrder(order);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Auto-dispatch run failed: ${message}`);
    }
  }

  private async findCandidates(): Promise<DispatchCandidate[]> {
    const rows = await this.dataSource.query(
      `SELECT o.id, o.tenant_id AS "tenantId", o.customer_id AS "customerId", o.vendor_id AS "vendorId",
              o.status, o.delivery_address AS "deliveryAddress",
              o.delivery_latitude AS "deliveryLatitude", o.delivery_longitude AS "deliveryLongitude",
              o.delivery_fee AS "deliveryFee", o.total_amount AS "totalAmount",
              v.shop_name AS "vendorName"
       FROM orders o
       JOIN vendors v ON v.id = o.vendor_id
       LEFT JOIN deliveries d ON d.order_id = o.id
       WHERE d.id IS NULL
         AND o.status IN ('PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP')
         AND o.created_at <= NOW() - INTERVAL '15 minutes'
         AND EXISTS (
           SELECT 1 FROM payments p
           WHERE p.order_id = o.id AND p.status IN ('ESCROW_HELD', 'RELEASED')
         )`,
    );
    return rows as DispatchCandidate[];
  }

  private async dispatchOrder(order: DispatchCandidate): Promise<void> {
    const driver = await this.pickDriver(order.tenantId);
    if (!driver) {
      this.logger.warn(`Auto-dispatch: no available driver for order ${order.id} in tenant ${order.tenantId}`);
      return;
    }

    const deliveryId = await this.dataSource.query(
      `INSERT INTO deliveries (
         id, tenant_id, order_id, driver_id, vehicle_type, status,
         pickup_address, delivery_address, delivery_latitude, delivery_longitude,
         driver_earnings, currency, version, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8, $9, $10, 'TZS', 1, NOW(), NOW())
       RETURNING id`,
      [
        randomUUID(),
        order.tenantId,
        order.id,
        driver.driverId,
        driver.vehicleType,
        `${order.vendorName} (pickup)`,
        order.deliveryAddress,
        order.deliveryLatitude,
        order.deliveryLongitude,
        Number(order.deliveryFee || 0),
      ],
    );

    await this.dataSource.query(
      `UPDATE orders SET status = 'READY_FOR_PICKUP', driver_id = $1, version = version + 1, updated_at = NOW() WHERE id = $2`,
      [driver.driverId, order.id],
    );

    const delivery = { deliveryId: (deliveryId[0] as { id: string }).id, orderId: order.id, status: 'PENDING' };

    await this.notifService.create({
      tenantId: order.tenantId,
      userId: driver.driverId,
      title: 'Delivery Assigned',
      message: `Pick up order ${order.id} from ${order.vendorName} and deliver to ${order.deliveryAddress}`,
      type: 'delivery_assigned',
      referenceId: order.id,
      referenceType: 'order',
    });

    this.gateway.notifyDriverDelivery(order.tenantId, driver.driverId, delivery);
    this.logger.log(`Auto-dispatch: order ${order.id} -> driver ${driver.driverId} (${driver.vehicleType})`);
  }

  private async pickDriver(tenantId: string): Promise<AvailableDriver | null> {
    const online = await this.dataSource.query(
      `SELECT v.driver_id AS "driverId", v.vehicle_type AS "vehicleType", v.plate_number AS "plateNumber"
       FROM vehicles v
       WHERE v.tenant_id = $1 AND v.is_online = true AND v.is_available = true
       ORDER BY v.updated_at DESC
       LIMIT 1`,
      [tenantId],
    );
    if (online.length > 0) {
      return online[0] as AvailableDriver;
    }
    const anyAvailable = await this.dataSource.query(
      `SELECT v.driver_id AS "driverId", v.vehicle_type AS "vehicleType", v.plate_number AS "plateNumber"
       FROM vehicles v
       WHERE v.tenant_id = $1 AND v.is_available = true
       ORDER BY v.updated_at DESC
       LIMIT 1`,
      [tenantId],
    );
    if (anyAvailable.length > 0) {
      return anyAvailable[0] as AvailableDriver;
    }
    return null;
  }
}
