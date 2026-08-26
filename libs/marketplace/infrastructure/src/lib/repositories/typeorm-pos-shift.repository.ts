import { Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { EntityManager } from 'typeorm';
import { PosShift, IPosShiftRepository, PosShiftStatus } from '@afri-market/marketplace-domain';
import { PosShiftOrmEntity } from '../entities/pos-shift-orm.entity';

@Injectable()
export class TypeOrmPosShiftRepository extends TypeOrmRepository<PosShift, PosShiftOrmEntity, EntityId> implements IPosShiftRepository {
  constructor(manager: EntityManager) {
    super(manager, PosShiftOrmEntity);
  }

  async findById(id: EntityId): Promise<PosShift | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(shift: PosShift): Promise<void> {
    const existing = await this.repository.findOne({ where: { id: shift.id.value } });
    if (existing) {
      Object.assign(existing, this.toOrm(shift));
      await this.repository.save(existing);
    } else {
      const entity = this.toOrm(shift);
      entity.id = shift.id.value;
      entity.tenantId = shift.tenantId.value;
      await this.repository.save(entity as PosShiftOrmEntity);
    }
  }

  async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  async findOpenByVendor(vendorId: string): Promise<PosShift | null> {
    const entity = await this.repository.findOne({ where: { vendorId, status: 'OPEN' } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByVendorAndDate(vendorId: string, start: Date, end: Date): Promise<PosShift[]> {
    const entities = await this.repository
      .createQueryBuilder('s')
      .where('s.vendor_id = :vendorId', { vendorId })
      .andWhere('s.opened_at >= :start', { start })
      .andWhere('(s.closed_at IS NULL OR s.closed_at <= :end)', { end })
      .orderBy('s.opened_at', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async countByVendorAndDay(vendorId: string, start: Date, end: Date): Promise<number> {
    return this.repository
      .createQueryBuilder('s')
      .where('s.vendor_id = :vendorId', { vendorId })
      .andWhere('s.opened_at >= :start', { start })
      .andWhere('(s.closed_at IS NULL OR s.closed_at <= :end)', { end })
      .getCount();
  }

  private toDomain(e: PosShiftOrmEntity): PosShift {
    return PosShift.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      operatorId: EntityId.from(e.operatorId),
      shiftNumber: e.shiftNumber,
      openedAt: e.openedAt,
      closedAt: e.closedAt ?? undefined,
      openingFloat: Number(e.openingFloat),
      closingCash: e.closingCash != null ? Number(e.closingCash) : undefined,
      expectedCash: e.expectedCash != null ? Number(e.expectedCash) : undefined,
      cashVariance: e.cashVariance != null ? Number(e.cashVariance) : undefined,
      totalSales: Number(e.totalSales),
      totalRefunds: Number(e.totalRefunds),
      salesCount: e.salesCount,
      paymentBreakdown: e.paymentBreakdown ?? {},
      status: e.status as PosShiftStatus,
      closedBy: e.closedBy ? EntityId.from(e.closedBy) : undefined,
      notes: e.notes ?? undefined,
      version: e.version,
    });
  }

  private toOrm(shift: PosShift): Partial<PosShiftOrmEntity> {
    return {
      id: shift.id.value,
      tenantId: shift.tenantId.value,
      vendorId: shift.vendorId.value,
      operatorId: shift.operatorId.value,
      shiftNumber: shift.shiftNumber,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt ?? null,
      openingFloat: shift.openingFloat,
      closingCash: shift.closingCash ?? null,
      expectedCash: shift.expectedCash ?? null,
      cashVariance: shift.cashVariance ?? null,
      totalSales: shift.totalSales,
      totalRefunds: shift.totalRefunds,
      salesCount: shift.salesCount,
      paymentBreakdown: shift.paymentBreakdown,
      status: shift.status,
      closedBy: shift.closedBy?.value ?? null,
      notes: shift.notes ?? null,
      version: shift.version,
    };
  }
}
