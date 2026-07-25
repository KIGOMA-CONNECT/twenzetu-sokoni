import { EntityId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CountryConfig, ICountryConfigRepository } from '@afri-market/marketplace-domain';
import { CountryConfigOrmEntity } from '../entities/country-config-orm.entity';

@Injectable()
export class TypeOrmCountryConfigRepository extends TypeOrmRepository<CountryConfig, CountryConfigOrmEntity, EntityId> implements ICountryConfigRepository {
  constructor(manager: EntityManager) {
    super(manager, CountryConfigOrmEntity);
  }

  public async findById(id: EntityId): Promise<CountryConfig | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByCountryCode(code: string): Promise<CountryConfig | null> {
    const entity = await this.repository.findOne({ where: { countryCode: code } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findActive(): Promise<CountryConfig[]> {
    const entities = await this.repository.find({ where: { isActive: true } });
    return entities.map((e) => this.toDomain(e));
  }

  public async save(entity: CountryConfig): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as CountryConfigOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  public async findAll(): Promise<CountryConfig[]> {
    const entities = await this.repository.find();
    return entities.map((e) => this.toDomain(e));
  }

  public async count(): Promise<number> {
    return this.repository.count();
  }

  private toDomain(e: CountryConfigOrmEntity): CountryConfig {
    return CountryConfig.reconstitute(EntityId.from(e.id), {
      countryCode: EntityId.from(e.countryCode),
      countryName: e.countryName,
      currency: e.currency,
      currencySymbol: e.currencySymbol,
      timezone: e.timezone,
      telecoms: e.telecoms,
      taxConfig: e.taxConfig,
      supportedPaymentMethods: e.supportedPaymentMethods,
      isActive: e.isActive,
      version: e.version,
    });
  }

  private toOrm(entity: CountryConfig): Partial<CountryConfigOrmEntity> {
    return {
      id: entity.id.value,
      countryCode: entity.countryCode,
      countryName: entity.countryName,
      currency: entity.currency,
      currencySymbol: entity.currencySymbol,
      timezone: entity.timezone,
      telecoms: entity.telecoms,
      taxConfig: entity.taxConfig,
      supportedPaymentMethods: entity.supportedPaymentMethods,
      isActive: entity.isActive,
      version: entity.version,
    };
  }
}
