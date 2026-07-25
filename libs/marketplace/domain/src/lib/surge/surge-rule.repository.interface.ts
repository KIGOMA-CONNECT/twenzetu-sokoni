import { EntityId, IRepository } from '@afri-market/kernel';
import { SurgeRule } from './surge-rule';

export interface ISurgeRuleRepository extends IRepository<SurgeRule, EntityId> {
  findActiveByTenant(tenantId: string): Promise<SurgeRule[]>;
  findByTrigger(trigger: string, tenantId: string): Promise<SurgeRule | null>;
}
