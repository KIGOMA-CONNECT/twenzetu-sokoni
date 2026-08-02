import { EntityId } from '@afri-market/kernel';
import { ServiceRequest } from './service-request.aggregate';

export interface IServiceRequestRepository {
  findById(id: EntityId): Promise<ServiceRequest | null>;
  findByCustomerId(tenantId: string, customerId: string): Promise<ServiceRequest[]>;
  findByVendorId(tenantId: string, vendorId: string, opts?: { status?: string }): Promise<ServiceRequest[]>;
  countOpenByTenant(tenantId: string): Promise<number>;
  save(entity: ServiceRequest): Promise<void>;
}
