import { EntityId } from '@afri-market/kernel';
import { ServiceListing } from './service-listing.aggregate';

export interface IServiceListingRepository {
  findById(id: EntityId): Promise<ServiceListing | null>;
  findByVendorId(tenantId: string, vendorId: string): Promise<ServiceListing[]>;
  findActive(tenantId: string, opts?: { category?: string; search?: string; limit?: number; offset?: number }): Promise<{ data: ServiceListing[]; total: number }>;
  save(entity: ServiceListing): Promise<void>;
  delete(id: EntityId): Promise<void>;
}
