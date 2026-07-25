import { EntityId, IRepository } from '@afri-market/kernel';
import { Vendor } from './vendor.aggregate';

export interface VendorCountFilters {
  status?: string;
}

export interface IVendorRepository extends IRepository<Vendor, EntityId> {
  findByUserId(userId: string): Promise<Vendor | null>;
  findByCategory(category: string): Promise<Vendor[]>;
  findActiveByTenant(tenantId: string): Promise<Vendor[]>;
  search(
    tenantId: string,
    opts?: { search?: string; category?: string; minRating?: number; limit?: number; offset?: number },
  ): Promise<{ data: Vendor[]; total: number }>;
  countByTenant(tenantId: string, filters?: VendorCountFilters): Promise<number>;
  searchAdmin(
    tenantId: string,
    opts?: { status?: string; limit?: number; offset?: number },
  ): Promise<{ data: Vendor[]; total: number }>;
}
