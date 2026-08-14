import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

interface OrderCandidate {
  id: string;
  tenantId: string;
  vendorName: string;
  deliveryAddress: string;
  deliveryLatitude: string | null;
  deliveryLongitude: string | null;
  deliveryFee: string;
}

@Injectable()
export class AssignDriverUseCase {
  constructor(private readonly dataSource: DataSource) {}

  public async execute(
    tenantId: string,
    orderId: string,
    driverId: string,
  ): Promise<{
    deliveryId: string;
    orderId: string;
    driverId: string;
    tenantId: string;
    vendorName: string;
    deliveryAddress: string;
  }> {
    const order = await this.findOrder(orderId, tenantId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found or already dispatched`);
    }

    // Atomically claim the order so a concurrent auto-dispatch run can never
    // also assign it. Orders already READY_FOR_PICKUP keep their state.
    const claimed = await this.dataSource.query(
      `UPDATE orders
       SET status = 'READY_FOR_PICKUP', driver_id = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 AND status IN ('PLACED', 'CONFIRMED', 'PREPARING')
       RETURNING id`,
      [driverId, orderId],
    );
    if (claimed.length === 0) {
      const existing = await this.dataSource.query(
        `SELECT 1 FROM deliveries WHERE order_id = $1 AND status <> 'FAILED' LIMIT 1`,
        [orderId],
      );
      if (existing.length > 0) {
        throw new BadRequestException('A delivery already exists for this order');
      }
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
        tenantId,
        orderId,
        driverId,
        await this.vehicleTypeForDriver(tenantId, driverId),
        `${order.vendorName} (pickup)`,
        order.deliveryAddress,
        order.deliveryLatitude,
        order.deliveryLongitude,
        Number(order.deliveryFee || 0),
      ],
    );

    return {
      deliveryId: (deliveryId[0] as { id: string }).id,
      orderId,
      driverId,
      tenantId,
      vendorName: order.vendorName,
      deliveryAddress: order.deliveryAddress,
    };
  }

  private async vehicleTypeForDriver(tenantId: string, driverId: string): Promise<string> {
    const rows = await this.dataSource.query(
      `SELECT vehicle_type AS "vehicleType" FROM vehicles
       WHERE driver_id = $1 AND tenant_id = $2
       ORDER BY updated_at DESC LIMIT 1`,
      [driverId, tenantId],
    );
    return (rows[0] as { vehicleType?: string } | undefined)?.vehicleType ?? 'motorcycle';
  }

  private async findOrder(orderId: string, tenantId: string): Promise<OrderCandidate | null> {
    const rows = await this.dataSource.query(
      `SELECT o.id, o.tenant_id AS "tenantId", v.shop_name AS "vendorName",
              o.delivery_address AS "deliveryAddress",
              o.delivery_latitude AS "deliveryLatitude", o.delivery_longitude AS "deliveryLongitude",
              o.delivery_fee AS "deliveryFee"
       FROM orders o
       JOIN vendors v ON v.id = o.vendor_id
       WHERE o.id = $1
         AND o.tenant_id = $2
         AND o.status IN ('PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP')
         AND NOT EXISTS (
           SELECT 1 FROM deliveries d
           WHERE d.order_id = o.id AND d.status <> 'FAILED'
         )
       LIMIT 1`,
      [orderId, tenantId],
    );
    return (rows[0] as OrderCandidate | undefined) ?? null;
  }
}
