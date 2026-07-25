import { EntityId, IRepository } from '@afri-market/kernel';
import { Dispute } from './dispute.aggregate';

export interface DisputeSearchFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface IDisputeRepository extends IRepository<Dispute, EntityId> {
  findByOrderId(orderId: string): Promise<Dispute | null>;
  findByCustomerId(customerId: string): Promise<Dispute[]>;
  findOpenByVendor(vendorId: string): Promise<Dispute[]>;
  findEscalated(): Promise<Dispute[]>;
  countByTenant(tenantId: string, status?: string): Promise<number>;
  search(tenantId: string, filters?: DisputeSearchFilters): Promise<{ data: Dispute[]; total: number }>;
}
