import { EntityId, IRepository } from '@afri-market/kernel';
import { PartnerKyc } from './partner-kyc.aggregate';
import { PartnerType } from './kyc-status';

export interface IPartnerKycRepository extends IRepository<PartnerKyc, EntityId> {
  findByPartnerId(partnerId: string): Promise<PartnerKyc | null>;
  findPending(): Promise<PartnerKyc[]>;
  findPendingByTenant(tenantId: string): Promise<PartnerKyc[]>;
  findPendingByType(partnerType: PartnerType): Promise<PartnerKyc[]>;
}
