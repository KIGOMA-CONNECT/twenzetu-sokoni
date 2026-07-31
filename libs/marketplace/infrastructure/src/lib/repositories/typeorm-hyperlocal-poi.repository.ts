import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { HyperlocalPoi, IHyperlocalPoiRepository, PoiType, PoiSource } from '@afri-market/marketplace-domain';
import { HyperlocalPoiOrmEntity } from '../entities/hyperlocal-poi-orm.entity';

@Injectable()
export class TypeOrmHyperlocalPoiRepository extends TypeOrmRepository<HyperlocalPoi, HyperlocalPoiOrmEntity, EntityId> implements IHyperlocalPoiRepository {
  constructor(manager: EntityManager) {
    super(manager, HyperlocalPoiOrmEntity);
  }

  public async findById(id: EntityId): Promise<HyperlocalPoi | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByProximity(latitude: number, longitude: number, radiusKm: number): Promise<HyperlocalPoi[]> {
    const entities = await this.repository.createQueryBuilder('poi')
      .where(
        `(6371 * acos(
          LEAST(1, COS(RADIANS(:lat)) * COS(RADIANS(poi.latitude)) *
                COS(RADIANS(poi.longitude) - RADIANS(:lng)) +
                SIN(RADIANS(:lat)) * SIN(RADIANS(poi.latitude)))
        )) <= :radiusKm`,
        { lat: latitude, lng: longitude, radiusKm },
      )
      .andWhere('poi.is_active = :active', { active: true })
      .getMany();
    return entities.map(e => this.toDomain(e));
  }

  public async findByType(type: string): Promise<HyperlocalPoi[]> {
    const entities = await this.repository.find({ where: { type, isActive: true } });
    return entities.map(e => this.toDomain(e));
  }

  public async findByTenant(tenantId: string): Promise<HyperlocalPoi[]> {
    const entities = await this.repository.find({ where: { tenantId, isActive: true } });
    return entities.map(e => this.toDomain(e));
  }

  public async findByDriver(driverId: string): Promise<HyperlocalPoi[]> {
    const entities = await this.repository.find({ where: { submittedBy: driverId } });
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: HyperlocalPoi): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as HyperlocalPoiOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: HyperlocalPoiOrmEntity): HyperlocalPoi {
    return HyperlocalPoi.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      name: e.name,
      localName: e.localName ?? undefined,
      description: e.description ?? undefined,
      type: e.type as PoiType,
      latitude: Number(e.latitude),
      longitude: Number(e.longitude),
      streetAddress: e.streetAddress ?? undefined,
      landmarkDescription: e.landmarkDescription ?? undefined,
      submittedBy: EntityId.from(e.submittedBy),
      source: e.source as PoiSource,
      verifiedBy: e.verifiedBy ? EntityId.from(e.verifiedBy) : undefined,
      verificationCount: e.verificationCount,
      isActive: e.isActive,
      version: e.version,
    });
  }

  private toOrm(entity: HyperlocalPoi): Partial<HyperlocalPoiOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      name: entity.name,
      localName: entity.localName ?? null,
      description: entity.description ?? null,
      type: entity.type,
      latitude: entity.latitude,
      longitude: entity.longitude,
      streetAddress: entity.streetAddress ?? null,
      landmarkDescription: entity.landmarkDescription ?? null,
      submittedBy: entity.submittedBy.value,
      source: entity.source,
      verifiedBy: entity.verifiedBy?.value ?? null,
      verificationCount: entity.verificationCount,
      isActive: entity.isActive,
      version: entity.version,
    };
  }
}
