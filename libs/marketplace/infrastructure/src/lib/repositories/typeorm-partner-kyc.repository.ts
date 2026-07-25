import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PartnerKyc, IPartnerKycRepository, PartnerType, KycStatus } from '@afri-market/marketplace-domain';
import { PartnerKycOrmEntity } from '../entities/partner-kyc-orm.entity';

@Injectable()
export class TypeOrmPartnerKycRepository extends TypeOrmRepository<PartnerKyc, PartnerKycOrmEntity, EntityId> implements IPartnerKycRepository {
  constructor(manager: EntityManager) {
    super(manager, PartnerKycOrmEntity);
  }

  public async findById(id: EntityId): Promise<PartnerKyc | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByPartnerId(partnerId: string): Promise<PartnerKyc | null> {
    const e = await this.repository.findOne({ where: { partnerId } });
    return e ? this.toDomain(e) : null;
  }

  public async findPending(): Promise<PartnerKyc[]> {
    const entities = await this.repository.find({ where: { status: 'PENDING' } });
    return entities.map(e => this.toDomain(e));
  }

  public async findPendingByType(partnerType: string): Promise<PartnerKyc[]> {
    const entities = await this.repository.find({ where: { status: 'PENDING', partnerType } });
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: PartnerKyc): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as PartnerKycOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: PartnerKycOrmEntity): PartnerKyc {
    return PartnerKyc.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      partnerId: EntityId.from(e.partnerId),
      partnerType: e.partnerType as PartnerType,
      phoneNumber: e.phoneNumber,
      status: e.status as KycStatus,
      nidaNumber: e.nidaNumber ?? undefined,
      tinNumber: e.tinNumber ?? undefined,
      licenseNumber: e.licenseNumber ?? undefined,
      nidaPhotoUrl: e.nidaPhotoUrl ?? undefined,
      selfiePhotoUrl: e.selfiePhotoUrl ?? undefined,
      faceMatchScore: e.faceMatchScore != null ? Number(e.faceMatchScore) : undefined,
      ocrExtractedData: e.ocrExtractedData ?? undefined,
      gpsLatitude: e.gpsLatitude != null ? Number(e.gpsLatitude) : undefined,
      gpsLongitude: e.gpsLongitude != null ? Number(e.gpsLongitude) : undefined,
      rejectionReason: e.rejectionReason ?? undefined,
      verifiedAt: e.verifiedAt ?? undefined,
      version: e.version,
    });
  }

  private toOrm(entity: PartnerKyc): Partial<PartnerKycOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      partnerId: entity.partnerId.value,
      partnerType: entity.partnerType,
      phoneNumber: entity.phoneNumber,
      status: entity.status,
      nidaNumber: entity.nidaNumber ?? null,
      tinNumber: entity.tinNumber ?? null,
      licenseNumber: entity.licenseNumber ?? null,
      nidaPhotoUrl: entity.nidaPhotoUrl ?? null,
      selfiePhotoUrl: entity.selfiePhotoUrl ?? null,
      faceMatchScore: entity.faceMatchScore ?? null,
      ocrExtractedData: entity.ocrExtractedData ?? null,
      gpsLatitude: entity.gpsLatitude ?? null,
      gpsLongitude: entity.gpsLongitude ?? null,
      rejectionReason: entity.rejectionReason ?? null,
      verifiedAt: entity.verifiedAt ?? null,
      version: entity.version,
    };
  }
}
