import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SystemConfigOrmEntity,
  TenantConfigOrmEntity,
  FeatureFlagOrmEntity,
} from '@abms/configuration-infrastructure';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(SystemConfigOrmEntity)
    private readonly systemConfigRepo: Repository<SystemConfigOrmEntity>,
    @InjectRepository(TenantConfigOrmEntity)
    private readonly tenantConfigRepo: Repository<TenantConfigOrmEntity>,
    @InjectRepository(FeatureFlagOrmEntity)
    private readonly featureFlagRepo: Repository<FeatureFlagOrmEntity>,
  ) {}

  // ── System Config ──

  async getSystemConfig(key: string): Promise<SystemConfigOrmEntity> {
    const config = await this.systemConfigRepo.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`System config with key "${key}" not found`);
    }
    return config;
  }

  async getSystemConfigs(category?: string): Promise<SystemConfigOrmEntity[]> {
    if (category) {
      return this.systemConfigRepo.find({ where: { category }, order: { key: 'ASC' } });
    }
    return this.systemConfigRepo.find({ order: { key: 'ASC' } });
  }

  async setSystemConfig(
    key: string,
    value: string,
    valueType = 'STRING',
    description?: string,
    category?: string,
  ): Promise<SystemConfigOrmEntity> {
    let config = await this.systemConfigRepo.findOne({ where: { key } });

    if (config) {
      config.value = value;
      config.valueType = valueType;
      if (description !== undefined) config.description = description;
      if (category !== undefined) config.category = category;
    } else {
      config = this.systemConfigRepo.create({
        key,
        value,
        valueType,
        description: description ?? null,
        category: category ?? null,
      });
    }

    return this.systemConfigRepo.save(config);
  }

  // ── Tenant Config ──

  async getTenantConfig(tenantId: string, key: string): Promise<TenantConfigOrmEntity> {
    const config = await this.tenantConfigRepo.findOne({ where: { tenantId, key } });
    if (!config) {
      throw new NotFoundException(`Tenant config with key "${key}" not found for tenant "${tenantId}"`);
    }
    return config;
  }

  async getTenantConfigs(tenantId: string, category?: string): Promise<TenantConfigOrmEntity[]> {
    if (category) {
      return this.tenantConfigRepo.find({ where: { tenantId, category }, order: { key: 'ASC' } });
    }
    return this.tenantConfigRepo.find({ where: { tenantId }, order: { key: 'ASC' } });
  }

  async setTenantConfig(
    tenantId: string,
    key: string,
    value: string,
    valueType = 'STRING',
    description?: string,
    category?: string,
  ): Promise<TenantConfigOrmEntity> {
    let config = await this.tenantConfigRepo.findOne({ where: { tenantId, key } });

    if (config) {
      config.value = value;
      config.valueType = valueType;
      if (description !== undefined) config.description = description;
      if (category !== undefined) config.category = category;
    } else {
      config = this.tenantConfigRepo.create({
        tenantId,
        key,
        value,
        valueType,
        description: description ?? null,
        category: category ?? null,
      });
    }

    return this.tenantConfigRepo.save(config);
  }

  // ── Feature Flags ──

  async getFeatureFlags(): Promise<FeatureFlagOrmEntity[]> {
    return this.featureFlagRepo.find({ order: { key: 'ASC' } });
  }

  async getFeatureFlag(
    key: string,
    tenantId?: string,
    userRole?: string,
  ): Promise<{ enabled: boolean; flag: FeatureFlagOrmEntity }> {
    const flag = await this.featureFlagRepo.findOne({ where: { key } });
    if (!flag) {
      throw new NotFoundException(`Feature flag "${key}" not found`);
    }

    if (flag.state === 'DISABLED') {
      return { enabled: false, flag };
    }

    if (flag.state === 'ENABLED') {
      const allowed = this.isAllowed(flag, tenantId, userRole);
      return { enabled: allowed, flag };
    }

    return { enabled: false, flag };
  }

  async setFeatureFlag(
    key: string,
    name: string,
    state: string,
    percentage?: number,
    allowedTenantIds?: string[],
    allowedRoles?: string[],
    description?: string,
  ): Promise<FeatureFlagOrmEntity> {
    const existing = await this.featureFlagRepo.findOne({ where: { key } });

    if (existing) {
      existing.name = name;
      existing.state = state;
      if (percentage !== undefined) existing.percentage = percentage;
      if (allowedTenantIds !== undefined) existing.allowedTenantIds = allowedTenantIds;
      if (allowedRoles !== undefined) existing.allowedRoles = allowedRoles;
      if (description !== undefined) existing.description = description;
      return this.featureFlagRepo.save(existing);
    }

    const created = this.featureFlagRepo.create({
      key, name, state,
      percentage: percentage ?? 100,
      allowedTenantIds: allowedTenantIds ?? null,
      allowedRoles: allowedRoles ?? null,
      description: description ?? null,
    } as Partial<FeatureFlagOrmEntity>);

    return this.featureFlagRepo.save(created as FeatureFlagOrmEntity);
  }

  private isAllowed(
    flag: FeatureFlagOrmEntity,
    tenantId?: string,
    userRole?: string,
  ): boolean {
    if (flag.percentage < 100) {
      const hash = this.hashString(flag.key + (tenantId ?? ''));
      const bucket = hash % 100;
      if (bucket >= flag.percentage) return false;
    }

    if (flag.allowedTenantIds && flag.allowedTenantIds.length > 0 && tenantId) {
      if (!flag.allowedTenantIds.includes(tenantId)) return false;
    }

    if (flag.allowedRoles && flag.allowedRoles.length > 0 && userRole) {
      if (!flag.allowedRoles.includes(userRole)) return false;
    }

    return true;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
