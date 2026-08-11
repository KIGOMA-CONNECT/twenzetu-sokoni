import { EntityId, IRepository } from '@afri-market/kernel';
import { VendorMember } from './vendor-member.aggregate';

export interface IVendorMemberRepository extends IRepository<VendorMember, EntityId> {
  findByVendorId(vendorId: string, status?: string): Promise<VendorMember[]>;
  findByUserId(userId: string): Promise<VendorMember[]>;
  findActiveByUserId(userId: string): Promise<VendorMember | null>;
  findOneByVendorAndUser(vendorId: string, userId: string): Promise<VendorMember | null>;
}
