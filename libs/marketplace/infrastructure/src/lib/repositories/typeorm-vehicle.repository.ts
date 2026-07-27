import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Vehicle, IVehicleRepository, VehicleType } from '@afri-market/marketplace-domain';
import { VehicleOrmEntity } from '../entities/vehicle-orm.entity';

@Injectable()
export class TypeOrmVehicleRepository extends TypeOrmRepository<Vehicle, VehicleOrmEntity, EntityId> implements IVehicleRepository {
  constructor(manager: EntityManager) {
    super(manager, VehicleOrmEntity);
  }

  public async findById(id: EntityId): Promise<Vehicle | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByIdAndTenant(id: string, tenantId: string): Promise<Vehicle | null> {
    const entity = await this.repository.findOne({ where: { id, tenantId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByDriverId(driverId: string): Promise<Vehicle[]> {
    const entities = await this.repository.find({ where: { driverId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findAvailable(tenantId: string): Promise<Vehicle[]> {
    const entities = await this.repository.find({ where: { tenantId, isAvailable: true } });
    return entities.map((e) => this.toDomain(e));
  }

  public async save(entity: Vehicle): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as VehicleOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: VehicleOrmEntity): Vehicle {
    return Vehicle.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      driverId: EntityId.from(e.driverId),
      vehicleType: e.vehicleType as VehicleType,
      plateNumber: e.plateNumber,
      capacityKg: Number(e.capacityKg),
      isAvailable: e.isAvailable,
      isOnline: e.isOnline,
      verifiedAt: e.verifiedAt ?? null,
      licensePhotoUrl: e.licensePhotoUrl ?? null,
      insurancePhotoUrl: e.insurancePhotoUrl ?? null,
      currentLatitude: e.currentLatitude ?? undefined,
      currentLongitude: e.currentLongitude ?? undefined,
      version: e.version,
    });
  }

  private toOrm(entity: Vehicle): Partial<VehicleOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      driverId: entity.driverId.value,
      vehicleType: entity.vehicleType,
      plateNumber: entity.plateNumber,
      capacityKg: entity.capacityKg,
      isAvailable: entity.isAvailable,
      isOnline: entity.isOnline,
      verifiedAt: entity.verifiedAt,
      licensePhotoUrl: entity.licensePhotoUrl,
      insurancePhotoUrl: entity.insurancePhotoUrl,
    };
  }
}
