import { EntityId, IRepository } from '@afri-market/kernel';
import { FieldAgent } from './field-agent.aggregate';

export interface IFieldAgentRepository extends IRepository<FieldAgent, EntityId> {
  findByUserId(userId: string): Promise<FieldAgent | null>;
  findByAgentCode(code: string): Promise<FieldAgent | null>;
  findActiveByTenant(tenantId: string): Promise<FieldAgent[]>;
}
